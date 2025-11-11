import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../src/config/firebase";
import { useAuth } from "../../src/context/AuthContext";
import { getUserPosts } from "../../src/services/postService";
import { Post } from "../../src/types";

const { width } = Dimensions.get("window");
const imageSize = width / 3;

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);

  const loadUserData = async (): Promise<void> => {
    if (user) {
      // Load posts
      const result = await getUserPosts(user.uid);
      if (result.success) {
        setPosts(result.posts);
      }

      // Load follower/following counts
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFollowersCount(userData.followersCount || 0);
          setFollowingCount(userData.followingCount || 0);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }

      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <MaskedView
          maskElement={
            <Text style={[styles.username, { backgroundColor: "transparent" }]}>
              {user?.username || "Username"}
            </Text>
          }
        >
          <LinearGradient
            colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.username, { opacity: 0 }]}>
              {user?.username || "Username"}
            </Text>
          </LinearGradient>
        </MaskedView>

        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => router.push("/(tabs)/create")}
          >
            <MaskedView
              style={{ width: 26, height: 26 }}
              maskElement={
                <View style={{ backgroundColor: "transparent" }}>
                  <Ionicons name="add-circle-outline" size={26} color="#000" />
                </View>
              }
            >
              <LinearGradient
                colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 26, height: 26 }}
              >
                <View style={{ width: 26, height: 26 }} />
              </LinearGradient>
            </MaskedView>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => {
              console.log("Menu button pressed");
              router.push("/profile-menu");
            }}
          >
            <MaskedView
              style={{ width: 26, height: 26 }}
              maskElement={
                <View style={{ backgroundColor: "transparent" }}>
                  <Ionicons name="menu" size={26} color="#000" />
                </View>
              }
            >
              <LinearGradient
                colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 26, height: 26 }}
              >
                <View style={{ width: 26, height: 26 }} />
              </LinearGradient>
            </MaskedView>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <View style={styles.avatarContainer}>
          {user?.photoURL ? (
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradientBorder}
              >
                <View style={styles.avatarInnerBorder}>
                  <Image
                    source={{ uri: user.photoURL }}
                    style={styles.avatar}
                  />
                </View>
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradientBorder}
              >
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color="#999" />
                </View>
              </LinearGradient>
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.stat}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.stat}>
            <Text style={styles.statNumber}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.stat}>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bio */}
      <View style={styles.bioContainer}>
        <Text style={styles.displayName}>{user?.displayName}</Text>
        {user?.bio ? (
          <Text style={styles.bio}>{user.bio}</Text>
        ) : (
          <Text style={styles.bioPlaceholder}>
            ✨ Add a bio to tell your story
          </Text>
        )}
      </View>

      {/* Edit Profile Button */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => router.push("/edit-profile")}
      >
        <LinearGradient
          colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.editButtonGradient}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={[styles.tab, styles.activeTab]}>
          <MaskedView
            style={{ width: 24, height: 24 }}
            maskElement={
              <View style={{ backgroundColor: "transparent" }}>
                <Ionicons name="grid" size={24} color="#000" />
              </View>
            }
          >
            <LinearGradient
              colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 24, height: 24 }}
            >
              <View style={{ width: 24, height: 24 }} />
            </LinearGradient>
          </MaskedView>
        </View>
      </View>

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <View style={styles.postsGrid}>
          {posts.map((post) => (
            <TouchableOpacity
              key={post.id}
              style={styles.gridItem}
              onPress={() => router.push(`/post/${post.id}`)}
            >
              <Image source={{ uri: post.imageUrl }} style={styles.gridImage} />
              <View style={styles.gridOverlay}>
                <View style={styles.gridStats}>
                  <Ionicons name="heart" size={20} color="#fff" />
                  <Text style={styles.gridStatText}>{post.likes || 0}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : !loading ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <LinearGradient
              colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIconGradient}
            >
              <Ionicons name="camera-outline" size={50} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.emptyText}>No Posts Yet</Text>
          <Text style={styles.emptySubtext}>
            Share your first photo or video
          </Text>
          <TouchableOpacity
            style={styles.createPostButton}
            onPress={() => router.push("/(tabs)/create")}
          >
            <LinearGradient
              colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createPostButtonGradient}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.createPostButtonText}>Create First Post</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#DBDBDB",
  },
  username: {
    fontSize: 22,
    letterSpacing: 0.3,
    fontFamily: 'Pacifico',
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconButton: {
    marginLeft: 16,
  },
  profileInfo: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 30,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarGradientBorder: {
    width: 92,
    height: 92,
    borderRadius: 46,
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInnerBorder: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#fff",
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#262626",
  },
  statLabel: {
    fontSize: 13,
    color: "#8E8E8E",
    marginTop: 2,
  },
  bioContainer: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  displayName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
    color: "#262626",
  },
  bio: {
    fontSize: 14,
    color: "#262626",
    lineHeight: 20,
  },
  bioPlaceholder: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  editButton: {
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#DD2A7B",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  editButtonGradient: {
    paddingVertical: 10,
    alignItems: "center",
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  tabsContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#DBDBDB",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#DBDBDB",
  },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridItem: {
    width: imageSize,
    height: imageSize,
    borderWidth: 1,
    borderColor: "#fff",
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0,
  },
  gridStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  gridStatText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#DD2A7B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#262626",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: "#8E8E8E",
    marginBottom: 30,
    textAlign: "center",
  },
  createPostButton: {
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#DD2A7B",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  createPostButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 14,
    gap: 8,
  },
  createPostButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
