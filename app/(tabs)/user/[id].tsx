import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../../src/config/firebase";
import { useAuth } from "../../../src/context/AuthContext";
import {
  checkIfFollowing,
  toggleFollow,
} from "../../../src/services/followService";
import { getUserPosts } from "../../../src/services/postService";
import { Post } from "../../../src/types";

const { width } = Dimensions.get("window");
const imageSize = width / 3;

interface UserData {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string;
  bio: string;
  followersCount: number;
  followingCount: number;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState<boolean>(false);

  const isOwnProfile = currentUser?.uid === id;

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // Fetch user data
        const userDoc = await getDoc(doc(db, "users", id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            uid: id,
            username: data.username || "Username",
            displayName: data.displayName || "User",
            photoURL: data.photoURL || "",
            bio: data.bio || "No bio yet",
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0,
          });
        }

        // Fetch user posts
        const result = await getUserPosts(id);
        if (result.success) {
          setPosts(result.posts);
        }

        // Check if current user is following this user
        if (currentUser && !isOwnProfile) {
          const followStatus = await checkIfFollowing(currentUser.uid, id);
          setIsFollowing(followStatus);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [id, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || !id || followLoading) return;

    try {
      setFollowLoading(true);
      const result = await toggleFollow(currentUser.uid, id);
      if (result.success) {
        setIsFollowing(result.isFollowing);

        // Update local follower count
        setUserData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            followersCount: result.isFollowing
              ? prev.followersCount + 1
              : prev.followersCount - 1,
          };
        });
      }
    } catch (error) {
      console.error("Error following user:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaskedView
          maskElement={<Text style={styles.loadingLogo}>Framez</Text>}
        >
          <LinearGradient
            colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.loadingLogo, { opacity: 0 }]}>Framez</Text>
          </LinearGradient>
        </MaskedView>
        <ActivityIndicator
          size="large"
          color="#DD2A7B"
          style={styles.spinner}
        />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <LinearGradient
            colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.errorIconGradient}
          >
            <Ionicons name="alert-circle-outline" size={50} color="#fff" />
          </LinearGradient>
        </View>
        <Text style={styles.errorText}>User not found</Text>
        <Text style={styles.errorSubtext}>
          This account may have been deleted
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <LinearGradient
            colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.backButtonGradient}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backButtonText}>Go Back</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <MaskedView
          maskElement={
            <Text style={[styles.username, { backgroundColor: "transparent" }]}>
              {userData.username}
            </Text>
          }
        >
          <LinearGradient
            colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.username, { opacity: 0 }]}>
              {userData.username}
            </Text>
          </LinearGradient>
        </MaskedView>
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <View style={styles.avatarContainer}>
          {userData.photoURL ? (
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradientBorder}
              >
                <View style={styles.avatarInnerBorder}>
                  <Image
                    source={{ uri: userData.photoURL }}
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
            <Text style={styles.statNumber}>{userData.followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.stat}>
            <Text style={styles.statNumber}>{userData.followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bio */}
      <View style={styles.bioContainer}>
        <Text style={styles.displayName}>{userData.displayName}</Text>
        <Text style={styles.bio}>{userData.bio}</Text>
      </View>

      {/* Action Buttons */}
      {isOwnProfile ? (
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
      ) : (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.followButton}
            onPress={handleFollow}
            disabled={followLoading}
          >
            {isFollowing ? (
              <View style={styles.followingButtonContent}>
                {followLoading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#000" />
                    <Text style={styles.followingButtonText}>Following</Text>
                  </>
                )}
              </View>
            ) : (
              <LinearGradient
                colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.followButtonGradient}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="person-add" size={18} color="#fff" />
                    <Text style={styles.followButtonText}>Follow</Text>
                  </>
                )}
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      )}

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
      ) : (
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
            {isOwnProfile
              ? "Share your first photo or video"
              : `${userData.username} hasn't posted yet`}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingLogo: {
    fontSize: 48,
    fontFamily: "Pacifico",
  },
  spinner: {
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 40,
  },
  errorIconContainer: {
    marginBottom: 20,
  },
  errorIconGradient: {
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
  errorText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#262626",
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 15,
    color: "#8E8E8E",
    marginBottom: 30,
    textAlign: "center",
  },
  backButton: {
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
  backButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 14,
    gap: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
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
  backIcon: {
    width: 28,
  },
  username: {
    fontSize: 22,
    letterSpacing: 0.3,
    fontFamily: "Pacifico",
  },
  moreIcon: {
    width: 28,
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
  actionButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 15,
    marginBottom: 20,
    gap: 10,
  },
  followButton: {
    flex: 1,
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
  followButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  followingButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#DBDBDB",
    borderRadius: 8,
  },
  followingButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#262626",
    letterSpacing: 0.3,
  },
  messageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: "#DBDBDB",
    borderRadius: 8,
    gap: 6,
  },
  messageButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#262626",
    letterSpacing: 0.3,
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
    textAlign: "center",
  },
});
