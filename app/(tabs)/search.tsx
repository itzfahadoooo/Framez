import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../src/config/firebase";
import { useAuth } from "../../src/context/AuthContext";

interface SearchUser {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string;
  bio: string;
  followersCount: number;
}

export default function SearchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      // Get recent popular users or users current user follows
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("followersCount", "desc"), limit(10));

      const snapshot = await getDocs(q);
      const users: SearchUser[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (doc.id !== user?.uid) {
          // Don't show current user
          users.push({
            uid: doc.id,
            username: data.username || "user",
            displayName: data.displayName || "User",
            photoURL: data.photoURL || "",
            bio: data.bio || "",
            followersCount: data.followersCount || 0,
          });
        }
      });

      setRecentSearches(users);
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);

    if (text.trim().length === 0) {
      setShowResults(false);
      setSearchResults([]);
      return;
    }

    setShowResults(true);
    setLoading(true);

    try {
      const usersRef = collection(db, "users");

      // Search by username (case-insensitive)
      const searchLower = text.toLowerCase();

      // Get all users and filter on client side for better search
      // In production, you'd want to use a proper search service like Algolia
      const snapshot = await getDocs(usersRef);
      const users: SearchUser[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const username = (data.username || "").toLowerCase();
        const displayName = (data.displayName || "").toLowerCase();

        // Check if username or display name contains search query
        if (
          (username.includes(searchLower) ||
            displayName.includes(searchLower)) &&
          doc.id !== user?.uid // Don't show current user
        ) {
          users.push({
            uid: doc.id,
            username: data.username || "user",
            displayName: data.displayName || "User",
            photoURL: data.photoURL || "",
            bio: data.bio || "",
            followersCount: data.followersCount || 0,
          });
        }
      });

      // Sort by followers count
      users.sort((a, b) => b.followersCount - a.followersCount);

      setSearchResults(users);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (userId: string) => {
    Keyboard.dismiss();
    router.push(`/user/${userId}`);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setShowResults(false);
    setSearchResults([]);
  };

  const renderUserItem = ({ item }: { item: SearchUser }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserPress(item.uid)}
    >
      <View style={styles.userLeft}>
        {item.photoURL ? (
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradientBorder}
            >
              <View style={styles.avatarInnerBorder}>
                <Image
                  source={{ uri: item.photoURL }}
                  style={styles.userAvatar}
                />
              </View>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.userAvatarPlaceholder}>
            <Ionicons name="person" size={22} color="#999" />
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.displayName}>{item.displayName}</Text>
          {item.bio && (
            <Text style={styles.bio} numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.followersContainer}>
        {item.followersCount > 0 && (
          <>
            <Text style={styles.followersCount}>{item.followersCount}</Text>
            <Text style={styles.followersLabel}>
              {item.followersCount === 1 ? "follower" : "followers"}
            </Text>
          </>
        )}
        <Ionicons name="chevron-forward" size={20} color="#DBDBDB" />
      </View>
    </TouchableOpacity>
  );

  const displayData = showResults ? searchResults : recentSearches;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header with Logo */}
      <View style={styles.header}>
        <MaskedView maskElement={<Text style={styles.logo}>Find</Text>}>
          <LinearGradient
            colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.logo, { opacity: 0 }]}>Framez</Text>
          </LinearGradient>
        </MaskedView>
      </View>

      {/* Search Bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loadingGradient}
          >
            <ActivityIndicator size="large" color="#fff" />
          </LinearGradient>
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <>
          {!showResults && recentSearches.length > 0 && (
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={20} color="#8E8E8E" />
              <Text style={styles.sectionTitle}>Suggested Users</Text>
            </View>
          )}

          {showResults &&
            searchResults.length === 0 &&
            searchQuery.length > 0 && (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <LinearGradient
                    colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.emptyIconGradient}
                  >
                    <Ionicons name="search-outline" size={50} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={styles.emptyText}>No users found</Text>
                <Text style={styles.emptySubtext}>
                  Try searching for a different username
                </Text>
              </View>
            )}

          <FlatList
            data={displayData}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.uid}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !loading && !showResults && recentSearches.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconContainer}>
                    <LinearGradient
                      colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.emptyIconGradient}
                    >
                      <Ionicons name="people-outline" size={50} color="#fff" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.emptyText}>Start searching</Text>
                  <Text style={styles.emptySubtext}>
                    Search for users by username or name
                  </Text>
                </View>
              ) : null
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#DBDBDB",
  },
  logo: {
    fontSize: 32,
    fontFamily: 'Pacifico',
  },
  searchHeader: {
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 44,
    borderWidth: 1.5,
    borderColor: "#DBDBDB",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#262626",
  },
  clearButton: {
    padding: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#FAFAFA",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#262626",
    letterSpacing: 0.3,
  },
  listContainer: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  userLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarWrapper: {
    marginRight: 12,
  },
  avatarGradientBorder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInnerBorder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff",
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#DBDBDB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: "700",
    color: "#262626",
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  displayName: {
    fontSize: 14,
    color: "#8E8E8E",
    marginBottom: 3,
  },
  bio: {
    fontSize: 13,
    color: "#999",
    lineHeight: 18,
  },
  followersContainer: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  followersCount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#262626",
  },
  followersLabel: {
    fontSize: 12,
    color: "#8E8E8E",
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#DD2A7B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    fontSize: 16,
    color: "#8E8E8E",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
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
    lineHeight: 22,
  },
});
