import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import { checkIfFollowing, toggleFollow } from "../services/followService";
import { toggleBookmark, toggleLike } from "../services/likeService";
import { deletePost } from "../services/postService";
import { Post } from "../types";

const { width } = Dimensions.get("window");

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  createdAt: string;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(post.likes || 0);
  const [commentsCount, setCommentsCount] = useState<number>(
    post.commentsCount || 0
  );
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [checkingFollowStatus, setCheckingFollowStatus] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);

  const [postUserData, setPostUserData] = useState<{
    displayName: string;
    photoURL: string;
  } | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(true);

  const isOwnPost = user?.uid === post.userId;

  useEffect(() => {
    const fetchPostUserData = async () => {
      try {
        setLoadingUserData(true);
        const userDoc = await getDoc(doc(db, "users", post.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setPostUserData({
            displayName: userData.displayName || post.userName,
            photoURL: userData.photoURL || post.userPhoto || "",
          });
        } else {
          setPostUserData({
            displayName: post.userName,
            photoURL: post.userPhoto || "",
          });
        }
      } catch (error) {
        console.error("Error fetching post user data:", error);
        setPostUserData({
          displayName: post.userName,
          photoURL: post.userPhoto || "",
        });
      } finally {
        setLoadingUserData(false);
      }
    };

    if (post.userId) {
      fetchPostUserData();
    } else {
      setPostUserData({
        displayName: post.userName,
        photoURL: post.userPhoto || "",
      });
      setLoadingUserData(false);
    }
  }, [post.userId, post.userName, post.userPhoto]);

  useEffect(() => {
    if (user) {
      setLiked(post.likedBy?.includes(user.uid) || false);
    }
  }, [user, post.likedBy]);

  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSaved(userData.savedPosts?.includes(post.id) || false);
        }
      } catch (error) {
        console.error("Error checking saved status:", error);
      }
    };

    checkSavedStatus();
  }, [user, post.id]);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!showActionMenu || !user || isOwnPost) return;

      try {
        setCheckingFollowStatus(true);
        const followStatus = await checkIfFollowing(user.uid, post.userId);
        setIsFollowing(followStatus);
      } catch (error) {
        console.error("Error checking follow status:", error);
      } finally {
        setCheckingFollowStatus(false);
      }
    };

    checkFollowStatus();
  }, [showActionMenu, user, post.userId, isOwnPost]);

  useEffect(() => {
    if (!showComments) return;

    setLoadingComments(true);
    const commentsRef = collection(db, "posts", post.id, "comments");
    const q = query(commentsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentsData: Comment[] = [];
        snapshot.forEach((doc) => {
          commentsData.push({ id: doc.id, ...doc.data() } as Comment);
        });
        setComments(commentsData);
        setLoadingComments(false);
      },
      (error) => {
        console.error("Error fetching comments:", error);
        setLoadingComments(false);
      }
    );

    return () => unsubscribe();
  }, [showComments, post.id]);

  const handleLike = async () => {
    if (!user) return;

    const result = await toggleLike(post.id, user.uid);
    if (result.success) {
      setLiked(result.isLiked);
      setLikesCount((prev) => (result.isLiked ? prev + 1 : prev - 1));
    }
  };

  const handleBookmark = async () => {
    if (!user) return;

    const result = await toggleBookmark(post.id, user.uid);
    if (result.success) {
      setSaved(result.isSaved);
    }
  };

  const handleOpenComments = () => {
    setShowComments(true);
  };

  const handlePostComment = async () => {
    if (!user || !commentText.trim() || postingComment) return;

    try {
      setPostingComment(true);

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      const commentsRef = collection(db, "posts", post.id, "comments");
      await addDoc(commentsRef, {
        userId: user.uid,
        userName: userData?.displayName || "Anonymous",
        userPhoto: userData?.photoURL || "",
        text: commentText.trim(),
        createdAt: new Date().toISOString(),
      });

      const postRef = doc(db, "posts", post.id);
      await updateDoc(postRef, {
        commentsCount: increment(1),
      });

      setCommentsCount((prev) => prev + 1);
      setCommentText("");
      Keyboard.dismiss();
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment. Please try again.");
    } finally {
      setPostingComment(false);
    }
  };

  const handleFollow = async () => {
    if (!user || actionLoading) return;

    try {
      setActionLoading(true);
      const result = await toggleFollow(user.uid, post.userId);
      if (result.success) {
        setIsFollowing(result.isFollowing);
      }
    } catch (error) {
      console.error("Error following user:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveFromMenu = async () => {
    if (!user || actionLoading) return;

    try {
      setActionLoading(true);
      const result = await toggleBookmark(post.id, user.uid);
      if (result.success) {
        setSaved(result.isSaved);
      }
    } catch (error) {
      console.error("Error saving post:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!user || deletingPost) return;

    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingPost(true);
              setShowActionMenu(false);

              const result = await deletePost(post.id, user.uid);

              if (result.success) {
                // Call the callback to remove the post from the list
                if (onPostDeleted) {
                  onPostDeleted(post.id);
                }
              } else {
                Alert.alert(
                  "Error",
                  "Failed to delete post. Please try again."
                );
              }
            } catch (error) {
              console.error("Error deleting post:", error);
              Alert.alert("Error", "Failed to delete post. Please try again.");
            } finally {
              setDeletingPost(false);
            }
          },
        },
      ]
    );
  };

  const handleViewProfile = () => {
    setShowActionMenu(false);
    router.push(`/user/${post.userId}`);
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Less than 24 hours → show relative time
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;

    // After 24 hours → show actual date (e.g. October 31)
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      {item.userPhoto ? (
        <View style={styles.commentAvatarWrapper}>
          <LinearGradient
            colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.commentAvatarBorder}
          >
            <Image
              source={{ uri: item.userPhoto }}
              style={styles.commentAvatar}
            />
          </LinearGradient>
        </View>
      ) : (
        <View style={styles.commentAvatarPlaceholder}>
          <Ionicons name="person" size={14} color="#999" />
        </View>
      )}
      <View style={styles.commentContent}>
        <Text style={styles.commentText}>
          <Text style={styles.commentUsername}>{item.userName} </Text>
          {item.text}
        </Text>
        <Text style={styles.commentTimestamp}>
          {formatTimestamp(item.createdAt)}
        </Text>
      </View>
    </View>
  );

  if (deletingPost) {
    return (
      <View style={[styles.container, styles.deletingContainer]}>
        <ActivityIndicator size="large" color="#DD2A7B" />
        <Text style={styles.deletingText}>Deleting post...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={handleViewProfile}
          activeOpacity={0.7}
        >
          {loadingUserData ? (
            <View style={styles.avatarPlaceholder}>
              <ActivityIndicator size="small" color="#999" />
            </View>
          ) : postUserData?.photoURL ? (
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradientBorder}
              >
                <Image
                  source={{ uri: postUserData.photoURL }}
                  style={styles.avatar}
                />
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={18} color="#999" />
            </View>
          )}
          {loadingUserData ? (
            <View style={styles.usernamePlaceholder} />
          ) : (
            <Text style={styles.username}>{postUserData?.displayName}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowActionMenu(true)}>
          <Ionicons name="ellipsis-vertical" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Image */}
      <Image
        source={{ uri: post.imageUrl }}
        style={styles.postImage}
        resizeMode="cover"
      />

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            {liked ? (
              <MaskedView
                maskElement={<Ionicons name="heart" size={28} color="#000" />}
              >
                <LinearGradient
                  colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientIcon}
                >
                  <Ionicons name="heart" size={28} style={{ opacity: 0 }} />
                </LinearGradient>
              </MaskedView>
            ) : (
              <Ionicons name="heart-outline" size={28} color="#000" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleOpenComments}
          >
            <Ionicons name="chatbubble-outline" size={26} color="#000" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleBookmark}>
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={26}
            color="#000"
          />
        </TouchableOpacity>
      </View>

      {/* Likes */}
      <View style={styles.likesContainer}>
        <Text style={styles.likes}>
          {likesCount} {likesCount === 1 ? "like" : "likes"}
        </Text>
      </View>

      {/* Caption */}
      <View style={styles.captionContainer}>
        {loadingUserData ? (
          <View style={styles.captionPlaceholder} />
        ) : (
          <Text style={styles.caption}>
            <Text style={styles.username} onPress={handleViewProfile}>
              {postUserData?.displayName}{" "}
            </Text>
            {post.caption}
          </Text>
        )}
      </View>

      {/* View Comments */}
      {commentsCount > 0 && (
        <TouchableOpacity onPress={handleOpenComments}>
          <Text style={styles.viewComments}>
            View all {commentsCount}{" "}
            {commentsCount === 1 ? "comment" : "comments"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Timestamp */}
      <Text style={styles.timestamp}>{formatTimestamp(post.createdAt)}</Text>

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        animationType="slide"
        onRequestClose={() => setShowComments(false)}
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowComments(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          <KeyboardAvoidingView
            style={styles.modalContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Comments</Text>
              <View style={{ width: 28 }} />
            </View>

            {/* Comments List */}
            {loadingComments ? (
              <View style={styles.loadingContainer}>
                <LinearGradient
                  colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loadingGradient}
                >
                  <ActivityIndicator size="large" color="#fff" />
                </LinearGradient>
              </View>
            ) : (
              <FlatList
                data={comments}
                renderItem={renderComment}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.commentsList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                      <LinearGradient
                        colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.emptyIconGradient}
                      >
                        <Ionicons
                          name="chatbubble-outline"
                          size={40}
                          color="#fff"
                        />
                      </LinearGradient>
                    </View>
                    <Text style={styles.emptyText}>No comments yet</Text>
                    <Text style={styles.emptySubtext}>
                      Be the first to comment
                    </Text>
                  </View>
                }
              />
            )}

            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
              {user && (
                <>
                  {user.photoURL ? (
                    <View style={styles.inputAvatarWrapper}>
                      <LinearGradient
                        colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.inputAvatarBorder}
                      >
                        <Image
                          source={{ uri: user.photoURL }}
                          style={styles.inputAvatar}
                        />
                      </LinearGradient>
                    </View>
                  ) : (
                    <View style={styles.inputAvatarPlaceholder}>
                      <Ionicons name="person" size={14} color="#999" />
                    </View>
                  )}
                </>
              )}
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                onPress={handlePostComment}
                disabled={!commentText.trim() || postingComment}
              >
                {postingComment ? (
                  <ActivityIndicator size="small" color="#DD2A7B" />
                ) : commentText.trim() ? (
                  <MaskedView
                    maskElement={<Text style={styles.postButton}>Post</Text>}
                  >
                    <LinearGradient
                      colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={[styles.postButton, { opacity: 0 }]}>
                        Post
                      </Text>
                    </LinearGradient>
                  </MaskedView>
                ) : (
                  <Text style={[styles.postButton, styles.postButtonDisabled]}>
                    Post
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Post Action Menu */}
      <Modal
        visible={showActionMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActionMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowActionMenu(false)}>
          <View style={styles.actionMenuOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.actionMenuContainer}>
                {checkingFollowStatus ? (
                  <View style={styles.menuLoadingContainer}>
                    <ActivityIndicator size="small" color="#DD2A7B" />
                  </View>
                ) : (
                  <>
                    {!isOwnPost && (
                      <>
                        <TouchableOpacity
                          style={styles.actionMenuItem}
                          onPress={handleFollow}
                          disabled={actionLoading}
                        >
                          <Ionicons
                            name={
                              isFollowing
                                ? "person-remove-outline"
                                : "person-add-outline"
                            }
                            size={22}
                            color={isFollowing ? "#ED4956" : "#262626"}
                          />
                          <Text
                            style={[
                              styles.actionMenuText,
                              isFollowing && styles.unfollowText,
                            ]}
                          >
                            {actionLoading
                              ? "Processing..."
                              : isFollowing
                              ? "Unfollow"
                              : "Follow"}
                          </Text>
                        </TouchableOpacity>

                        <View style={styles.actionMenuDivider} />

                        <TouchableOpacity
                          style={styles.actionMenuItem}
                          onPress={handleSaveFromMenu}
                          disabled={actionLoading}
                        >
                          <Ionicons
                            name={saved ? "bookmark" : "bookmark-outline"}
                            size={22}
                            color="#262626"
                          />
                          <Text style={styles.actionMenuText}>
                            {actionLoading
                              ? "Processing..."
                              : saved
                              ? "Unsave"
                              : "Save"}
                          </Text>
                        </TouchableOpacity>

                        <View style={styles.actionMenuDivider} />
                      </>
                    )}

                    <TouchableOpacity
                      style={styles.actionMenuItem}
                      onPress={handleViewProfile}
                    >
                      <Ionicons
                        name="person-circle-outline"
                        size={22}
                        color="#262626"
                      />
                      <Text style={styles.actionMenuText}>
                        {isOwnPost
                          ? "View Profile"
                          : `View ${postUserData?.displayName}'s Profile`}
                      </Text>
                    </TouchableOpacity>

                    {isOwnPost && (
                      <>
                        <TouchableOpacity
                          style={styles.actionMenuItem}
                          onPress={handleDeletePost}
                          disabled={deletingPost}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={22}
                            color="#ED4956"
                          />
                          <Text
                            style={[styles.actionMenuText, styles.deleteText]}
                          >
                            {deletingPost ? "Deleting..." : "Delete Post"}
                          </Text>
                        </TouchableOpacity>

                        <View style={styles.actionMenuDivider} />
                      </>
                    )}

                    <View style={styles.actionMenuDivider} />

                    <TouchableOpacity
                      style={styles.actionMenuItem}
                      onPress={() => setShowActionMenu(false)}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  deletingContainer: {
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  deletingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#8E8E8E",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    marginRight: 10,
  },
  avatarGradientBorder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: "#DBDBDB",
    justifyContent: "center",
    alignItems: "center",
  },
  username: {
    fontWeight: "700",
    fontSize: 14,
    color: "#262626",
  },
  usernamePlaceholder: {
    width: 100,
    height: 14,
    backgroundColor: "#DBDBDB",
    borderRadius: 4,
  },
  postImage: {
    width: width,
    height: width,
    backgroundColor: "#FAFAFA",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionsLeft: {
    flexDirection: "row",
  },
  actionButton: {
    marginRight: 15,
  },
  gradientIcon: {
    width: 28,
    height: 28,
  },
  likesContainer: {
    paddingHorizontal: 15,
  },
  likes: {
    fontWeight: "700",
    fontSize: 14,
    color: "#262626",
  },
  captionContainer: {
    paddingHorizontal: 15,
    paddingTop: 5,
  },
  caption: {
    fontSize: 14,
    lineHeight: 18,
    color: "#262626",
  },
  captionPlaceholder: {
    width: "80%",
    height: 14,
    backgroundColor: "#DBDBDB",
    borderRadius: 4,
  },
  viewComments: {
    paddingHorizontal: 15,
    paddingTop: 5,
    fontSize: 14,
    color: "#8E8E8E",
  },
  timestamp: {
    paddingHorizontal: 15,
    paddingTop: 5,
    paddingBottom: 10,
    fontSize: 12,
    color: "#8E8E8E",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    height: "70%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#DBDBDB",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#262626",
  },
  commentsList: {
    paddingVertical: 10,
    flexGrow: 1,
  },
  commentItem: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  commentAvatarWrapper: {
    marginRight: 10,
  },
  commentAvatarBorder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  commentAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: "#DBDBDB",
    justifyContent: "center",
    alignItems: "center",
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 18,
    color: "#262626",
  },
  commentUsername: {
    fontWeight: "700",
  },
  commentTimestamp: {
    fontSize: 12,
    color: "#8E8E8E",
    marginTop: 4,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#DBDBDB",
    backgroundColor: "#fff",
  },
  inputAvatarWrapper: {
    marginRight: 10,
  },
  inputAvatarBorder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  inputAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  inputAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: "#DBDBDB",
    justifyContent: "center",
    alignItems: "center",
  },
  commentInput: {
    flex: 1,
    maxHeight: 100,
    fontSize: 14,
    paddingVertical: 8,
    color: "#262626",
  },
  postButton: {
    fontWeight: "700",
    fontSize: 14,
    paddingLeft: 10,
  },
  postButtonDisabled: {
    color: "#DBDBDB",
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
    color: "#262626",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#8E8E8E",
    marginTop: 4,
  },
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionMenuContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "85%",
    maxWidth: 400,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  menuLoadingContainer: {
    paddingVertical: 30,
    alignItems: "center",
  },
  actionMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  actionMenuText: {
    fontSize: 15,
    marginLeft: 15,
    color: "#262626",
    fontWeight: "600",
  },
  unfollowText: {
    color: "#ED4956",
  },
  deleteText: {
    color: "#ED4956",
  },
  cancelText: {
    fontSize: 15,
    color: "#262626",
    fontWeight: "700",
    textAlign: "center",
    width: "100%",
  },
  actionMenuDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },
});

export default PostCard;
