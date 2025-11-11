import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { db } from "../src/config/firebase";
import { useAuth } from "../src/context/AuthContext";
import { uploadImageToCloudinary } from "../src/services/cloudinaryService";

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploadingPhoto(true);
      const uploadResult = await uploadImageToCloudinary(result.assets[0].uri);

      if (uploadResult.success && uploadResult.url) {
        setPhotoURL(uploadResult.url);
        Alert.alert("Success", "Photo uploaded! Click the checkmark to save.");
      } else {
        Alert.alert("Error", "Failed to upload photo");
      }
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!displayName.trim() || !username.trim()) {
      Alert.alert("Error", "Name and username are required");
      return;
    }

    setLoading(true);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
        photoURL: photoURL,
      });

      // Refresh user context
      await refreshUser();

      setLoading(false);

      // Navigate back
      router.back();

      // Show success
      setTimeout(() => {
        Alert.alert("Success", "Profile updated successfully!");
      }, 300);
    } catch (error: any) {
      setLoading(false);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.push('/profile')} 
          disabled={loading}
          style={styles.headerButton}
        >
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Edit Profile</Text>
        
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading || uploadingPhoto}
          style={styles.headerButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#DD2A7B" />
          ) : (
            <MaskedView
              maskElement={
                <Ionicons name="checkmark" size={28} color="#000" />
              }
            >
              <LinearGradient
                colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.checkmarkGradient}
              >
                <Ionicons name="checkmark" size={28} style={{ opacity: 0 }} />
              </LinearGradient>
            </MaskedView>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradientBorder}
            >
              <View style={styles.avatarInnerBorder}>
                {photoURL ? (
                  <Image source={{ uri: photoURL }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={45} color="#999" />
                  </View>
                )}
                {uploadingPhoto && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
              </View>
            </LinearGradient>
            
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={pickImage} 
              disabled={uploadingPhoto}
            >
              <LinearGradient
                colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cameraButtonGradient}
              >
                <Ionicons name="camera" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={pickImage} disabled={uploadingPhoto}>
            <MaskedView
              maskElement={
                <Text style={styles.changePhoto}>
                  {uploadingPhoto ? "Uploading..." : "Change Profile Photo"}
                </Text>
              }
            >
              <LinearGradient
                colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={[styles.changePhoto, { opacity: 0 }]}>
                  {uploadingPhoto ? "Uploading..." : "Change Profile Photo"}
                </Text>
              </LinearGradient>
            </MaskedView>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="at" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <View style={[styles.inputContainer, styles.bioInputContainer]}>
              <Ionicons name="create-outline" size={20} color="#999" style={styles.bioIcon} />
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself"
                multiline
                maxLength={150}
                placeholderTextColor="#999"
              />
            </View>
            <Text style={styles.charCount}>{bio.length}/150</Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading || uploadingPhoto}
          >
            <LinearGradient
              colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerButton: {
    width: 40,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  checkmarkGradient: {
    width: 28,
    height: 28,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarGradientBorder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInnerBorder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#fff",
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatar: {
    width: 98,
    height: 98,
    borderRadius: 49,
  },
  avatarPlaceholder: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingOverlay: {
    position: "absolute",
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#DD2A7B",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cameraButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  changePhoto: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#262626",
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderWidth: 1.5,
    borderColor: "#DBDBDB",
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#262626",
  },
  bioInputContainer: {
    alignItems: "flex-start",
    paddingTop: 14,
  },
  bioIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  bioInput: {
    height: 90,
    textAlignVertical: "top",
  },
  charCount: {
    textAlign: "right",
    color: "#999",
    fontSize: 12,
    marginTop: 6,
    fontStyle: "italic",
  },
  saveButton: {
    marginTop: 20,
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#DD2A7B",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});