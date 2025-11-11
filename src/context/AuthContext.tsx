import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { auth, db } from "../config/firebase";
import { AuthContextType, AuthResult, User } from "../types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to get user-friendly error messages
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please login instead.";
    case "auth/invalid-email":
      return "Invalid email address format.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
      return "No account found with this email. Please sign up.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials.";
    default:
      return "An error occurred. Please try again.";
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadUserData = async (firebaseUser: FirebaseUser) => {
    try {
      console.log('✅ Loading user data for:', firebaseUser.uid);
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      const userData = userDoc.data();

      const loadedUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: userData?.displayName || firebaseUser.displayName || "",
        photoURL: userData?.photoURL || firebaseUser.photoURL || "",
        username: userData?.username || firebaseUser.email?.split("@")[0] || "",
        bio: userData?.bio || "",
        postsCount: userData?.postsCount || 0,
        followersCount: userData?.followersCount || 0,
        followingCount: userData?.followingCount || 0,
        likedPosts: userData?.likedPosts || [],
        savedPosts: userData?.savedPosts || [],
      };

      console.log('✅ User data loaded successfully:', loadedUser.email);
      setUser(loadedUser);
      await AsyncStorage.setItem("user", JSON.stringify(firebaseUser.uid));
    } catch (error) {
      console.error("❌ Error loading user data:", error);
    }
  };

  useEffect(() => {
    console.log('🔄 Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        console.log('🔄 Auth state changed:', firebaseUser ? `User: ${firebaseUser.email}` : '❌ No user (logged out)');
        
        if (firebaseUser) {
          await loadUserData(firebaseUser);
        } else {
          console.log('🚪 Clearing user state - user logged out');
          setUser(null);
          await AsyncStorage.removeItem("user");
        }
        setLoading(false);
        console.log('✅ Auth state update complete, loading:', false);
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    console.log('🔄 Refreshing user data...');
    const currentUser = auth.currentUser;
    if (currentUser) {
      await loadUserData(currentUser);
    }
  };

  const signup = async (
    email: string,
    password: string,
    displayName: string,
    username: string
  ): Promise<AuthResult> => {
    try {
      console.log('📝 Signing up user:', email);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: displayName,
      });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: email,
        displayName: displayName,
        username: username || email.split("@")[0],
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          displayName
        )}&background=random`,
        createdAt: new Date().toISOString(),
        bio: "",
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
        likedPosts: [],
        savedPosts: [],
      });

      console.log('✅ Signup successful');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      const errorMessage = getAuthErrorMessage(error.code);
      return { success: false, error: errorMessage };
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      console.log('🔐 Logging in user:', email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      const errorMessage = getAuthErrorMessage(error.code);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async (): Promise<AuthResult> => {
    try {
      console.log("🚪 LOGOUT: Starting logout process...");
      console.log("🚪 LOGOUT: Current user before:", auth.currentUser?.email);
      
      // Sign out from Firebase - this triggers onAuthStateChanged which will set user to null
      await signOut(auth);
      
      console.log("✅ LOGOUT: Firebase signOut completed");
      console.log("🚪 LOGOUT: Current Firebase user after:", auth.currentUser);
      console.log("✅ LOGOUT: Success - onAuthStateChanged will handle state update");
      
      return { success: true };
    } catch (error: any) {
      console.error("❌ LOGOUT ERROR:", error);
      return { success: false, error: error.message };
    }
  };

  // Log user state changes
  useEffect(() => {
    console.log('👤 User state changed to:', user ? `✅ ${user.email}` : '❌ null (logged out)');
  }, [user]);

  const value: AuthContextType = {
    user,
    loading,
    signup,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};