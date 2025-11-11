import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
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

      // Redirect to login
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
        <ActivityIndicator size="large" color="#000" />
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
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  console.log("✅ TabLayout Render - Rendering tabs for:", user.email);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#999",
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#DBDBDB",
          height: 50,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "add-circle" : "add-circle-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={28}
              color={color}
            />
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
});
