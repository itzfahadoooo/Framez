import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/context/AuthContext';
import { createPost } from '../../src/services/postService';
import { uploadImageToCloudinary } from '../../src/services/cloudinaryService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

export default function CreatePostScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);

  const pickImage = async (): Promise<void> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = async (): Promise<void> => {
    if (!image) {
      Alert.alert('Error', 'Please select an image');
      return;
    }

    if (!caption.trim()) {
      Alert.alert('Error', 'Please add a caption');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setUploading(true);

    try {
      const uploadResult = await uploadImageToCloudinary(image);
      
      if (!uploadResult.success) {
        Alert.alert('Upload Failed', 'Failed to upload image');
        setUploading(false);
        return;
      }

      const postResult = await createPost(
        user.uid,
        user.displayName,
        user.photoURL,
        caption,
        uploadResult.url!
      );

      setUploading(false);

      if (postResult.success) {
        // Clear form
        setImage(null);
        setCaption('');
        
        // Navigate to feed without alert - smoother UX
        router.push('/(tabs)');
        
        // Show success message after navigation
        setTimeout(() => {
          Alert.alert('Success', 'Post created successfully!');
        }, 500);
      } else {
        Alert.alert('Error', postResult.error || 'Failed to create post');
      }
    } catch (error: any) {
      setUploading(false);
      Alert.alert('Error', error.message);
    }
  };

  const canPost = image && caption.trim() && !uploading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={30} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>New Post</Text>
        
        <TouchableOpacity 
          onPress={handlePost}
          disabled={!canPost}
          style={styles.shareButtonContainer}
        >
          {canPost ? (
            <MaskedView
              maskElement={
                <Text style={styles.shareButton}>Share</Text>
              }
            >
              <LinearGradient
                colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={[styles.shareButton, { opacity: 0 }]}>Share</Text>
              </LinearGradient>
            </MaskedView>
          ) : (
            <Text style={[styles.shareButton, styles.shareButtonDisabled]}>
              Share
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!image ? (
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            <View style={styles.imagePickerIconContainer}>
              <LinearGradient
                colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.imagePickerIconGradient}
              >
                <Ionicons name="images" size={50} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.imagePickerTitle}>Select a Photo</Text>
            <Text style={styles.imagePickerSubtext}>
              Choose from your gallery
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.selectedImage} />
            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={pickImage}
            >
              <LinearGradient
                colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.changeImageGradient}
              >
                <Ionicons name="images-outline" size={18} color="#fff" />
                <Text style={styles.changeImageText}>Change Photo</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.captionSection}>
          <View style={styles.captionHeader}>
            {user?.photoURL ? (
              <View style={styles.avatarWrapper}>
                <LinearGradient
                  colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradientBorder}
                >
                  <View style={styles.avatarInnerBorder}>
                    <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                  </View>
                </LinearGradient>
              </View>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={18} color="#999" />
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.displayName}</Text>
              <Text style={styles.userHandle}>@{user?.username}</Text>
            </View>
          </View>

          <View style={styles.captionContainer}>
            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption..."
              placeholderTextColor="#999"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={2200}
            />
            <Text style={styles.charCount}>{caption.length}/2200</Text>
          </View>
        </View>
      </ScrollView>

      {uploading && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingContent}>
            <LinearGradient
              colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.uploadingGradient}
            >
              <ActivityIndicator size="large" color="#fff" />
            </LinearGradient>
            <Text style={styles.uploadingText}>Creating your post...</Text>
            <Text style={styles.uploadingSubtext}>This won&apos;t take long</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DBDBDB',
  },
  closeButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  shareButtonContainer: {
    width: 60,
    alignItems: 'flex-end',
  },
  shareButton: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  shareButtonDisabled: {
    color: '#DBDBDB',
  },
  content: {
    flex: 1,
  },
  imagePicker: {
    height: 350,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#DBDBDB',
  },
  imagePickerIconContainer: {
    marginBottom: 24,
  },
  imagePickerIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DD2A7B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  imagePickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#262626',
    marginBottom: 8,
  },
  imagePickerSubtext: {
    fontSize: 15,
    color: '#8E8E8E',
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#DBDBDB',
    backgroundColor: '#FAFAFA',
  },
  selectedImage: {
    width: '100%',
    height: 350,
    resizeMode: 'cover',
  },
  changeImageButton: {
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#DD2A7B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  changeImageGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  captionSection: {
    padding: 20,
  },
  captionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    marginRight: 12,
  },
  avatarGradientBorder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInnerBorder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
    backgroundColor: '#DBDBDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#262626',
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 13,
    color: '#8E8E8E',
  },
  captionContainer: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#DBDBDB',
    borderRadius: 12,
    padding: 15,
  },
  captionInput: {
    fontSize: 15,
    color: '#262626',
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    color: '#999',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingContent: {
    alignItems: 'center',
  },
  uploadingGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  uploadingSubtext: {
    color: '#DBDBDB',
    fontSize: 14,
  },
});