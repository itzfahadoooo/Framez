import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useAuth } from "../../src/context/AuthContext";

export default function TabLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Protect tabs - redirect to login if not authenticated
  useEffect(() => {
    console.log(
      "📱 TabLayout Effect - User:",
      user ? user.email : "null",
      "Loading:",
      loading
    );

    if (!loading && !user) {
      console.log("🚨 TabLayout - NO USER DETECTED! Redirecting to login...");

      try {
        router.replace("/(auth)/login");
        console.log("✅ TabLayout - Redirect command sent");
      } catch (error) {
        console.error("❌ TabLayout - Redirect error:", error);
      }
    } else if (!loading && user) {
      console.log("✅ TabLayout - User authenticated:", user.email);
    } else if (loading) {
      console.log("⏳ TabLayout - Still loading auth state...");
    }
  }, [user, loading]);

  // Show loading while checking auth
  if (loading) {
    console.log("⏳ TabLayout Render - Loading...");
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
        </LinearGradient>
      </View>
    );
  }

  // Don't render tabs if no user
  if (!user) {
    console.log(
      "🚫 TabLayout Render - No user, showing loading (redirect pending)"
    );
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
        </LinearGradient>
      </View>
    );
  }

  console.log("✅ TabLayout Render - Rendering tabs for:", user.email);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#262626",
        tabBarInactiveTintColor: "#8E8E8E",
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#DBDBDB",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: '#fff',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconContainer}>
              {focused ? (
                <MaskedView
                  maskElement={
                    <Ionicons name="home" size={28} color="#000" />
                  }
                >
                  <LinearGradient
                    colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.tabIconGradient}
                  >
                    <Ionicons name="home" size={28} style={{ opacity: 0 }} />
                  </LinearGradient>
                </MaskedView>
              ) : (
                <Ionicons name="home-outline" size={28} color={color} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconContainer}>
              {focused ? (
                <MaskedView
                  maskElement={
                    <Ionicons name="search" size={28} color="#000" />
                  }
                >
                  <LinearGradient
                    colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.tabIconGradient}
                  >
                    <Ionicons name="search" size={28} style={{ opacity: 0 }} />
                  </LinearGradient>
                </MaskedView>
              ) : (
                <Ionicons name="search-outline" size={28} color={color} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconContainer}>
              {focused ? (
                <LinearGradient
                  colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.createButtonGradient}
                >
                  <Ionicons name="add" size={32} color="#fff" />
                </LinearGradient>
              ) : (
                <View style={styles.createButtonOutline}>
                  <Ionicons name="add-circle-outline" size={28} color={color} />
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconContainer}>
              {focused ? (
                <MaskedView
                  maskElement={
                    <Ionicons name="person" size={28} color="#000" />
                  }
                >
                  <LinearGradient
                    colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.tabIconGradient}
                  >
                    <Ionicons name="person" size={28} style={{ opacity: 0 }} />
                  </LinearGradient>
                </MaskedView>
              ) : (
                <Ionicons name="person-outline" size={28} color={color} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="user/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="post/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: '#DD2A7B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tabIconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  tabIconGradient: {
    width: 28,
    height: 28,
  },
  createButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: '#DD2A7B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  createButtonOutline: {
    justifyContent: "center",
    alignItems: "center",
  },
});