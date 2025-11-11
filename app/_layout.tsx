// app/_layout.tsx
import { useFonts } from "expo-font";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { db } from "../src/config/firebase";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

SplashScreen.preventAutoHideAsync();

// This component handles the auth routing logic
function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (loading) {
        console.log("⏳ Still loading auth state...");
        return;
      }

      const inAuthGroup = segments[0] === "(auth)";
      const inOnboarding = segments[0] === "onboarding";

      console.log("🧭 Navigation check:", {
        user: user?.email || "none",
        loading,
        currentSegment: segments[0],
        inAuthGroup,
        inOnboarding,
      });

      if (!user && !inAuthGroup) {
        // User is not signed in and not in auth group, redirect to login
        console.log("➡️ Redirecting to login (no user)");
        setCheckingOnboarding(false);
        router.replace("/(auth)/login");
      } else if (user) {
        // User is signed in, check onboarding status
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const needsOnboarding =
              !userData.onboardingCompleted ||
              !userData.username ||
              !userData.displayName;

            console.log("🎯 Onboarding check:", {
              needsOnboarding,
              onboardingCompleted: userData.onboardingCompleted,
              hasUsername: !!userData.username,
              hasDisplayName: !!userData.displayName,
              currentSegment: segments[0],
            });

            if (needsOnboarding && !inOnboarding) {
              console.log("➡️ Redirecting to onboarding (incomplete profile)");
              setCheckingOnboarding(false);
              router.replace("/onboarding");
            } else if (!needsOnboarding && (inOnboarding || inAuthGroup)) {
              console.log("➡️ Redirecting to tabs (onboarding complete)");
              setCheckingOnboarding(false);
              router.replace("/(tabs)");
            } else {
              console.log("✅ User in correct location");
              setCheckingOnboarding(false);
            }
          } else {
            // User document doesn't exist somehow, needs onboarding
            console.log("⚠️ User document missing, redirect to onboarding");
            if (!inOnboarding) {
              setCheckingOnboarding(false);
              router.replace("/onboarding");
            }
          }
        } catch (error) {
          console.error("❌ Error checking onboarding:", error);
          setCheckingOnboarding(false);
        }
      } else {
        setCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [user, loading, segments]);

  // Show loading screen while checking auth state or onboarding
  if (loading || checkingOnboarding) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8134AF" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Pacifico: require("../assets/fonts/Pacifico-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <RootLayoutNav />
          <Toast />
        </SafeAreaView>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
