import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { doc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../src/config/firebase';
import { uploadImageToCloudinary } from '../src/services/cloudinaryService';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [photoUri, setPhotoUri] = useState<string>('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);

  const totalSteps = 4;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const checkUsernameAvailability = async (usernameToCheck: string): Promise<boolean> => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      return false;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', usernameToCheck.toLowerCase()));
      const snapshot = await getDocs(q);
      
      return snapshot.empty;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  const handleUsernameChange = async (text: string) => {
    const cleanText = text.toLowerCase().replace(/[^a-z0-9_.]/g, '');
    setUsername(cleanText);
    setUsernameError('');

    if (cleanText.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }

    if (cleanText.length > 30) {
      setUsernameError('Username must be less than 30 characters');
      return;
    }

    setCheckingUsername(true);
    const isAvailable = await checkUsernameAvailability(cleanText);
    setCheckingUsername(false);

    if (!isAvailable) {
      setUsernameError('Username is already taken');
    }
  };

  const uploadProfilePhoto = async (): Promise<string> => {
    if (!photoUri || !user) return '';

    try {
      console.log('📤 Uploading profile photo to Cloudinary...');
      const uploadResult = await uploadImageToCloudinary(photoUri);
      
      if (uploadResult.success && uploadResult.url) {
        console.log('✅ Profile photo uploaded successfully');
        return uploadResult.url;
      } else {
        throw new Error(uploadResult.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!displayName.trim()) {
        Alert.alert('Required', 'Please enter your name');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!username.trim()) {
        Alert.alert('Required', 'Please enter a username');
        return;
      }
      if (usernameError) {
        Alert.alert('Invalid Username', usernameError);
        return;
      }
      if (username.length < 3) {
        Alert.alert('Invalid Username', 'Username must be at least 3 characters');
        return;
      }
      
      setCheckingUsername(true);
      const isAvailable = await checkUsernameAvailability(username);
      setCheckingUsername(false);
      
      if (!isAvailable) {
        Alert.alert('Username Taken', 'This username is already in use. Please choose another.');
        return;
      }
      
      setCurrentStep(4);
    } else if (currentStep === 4) {
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    setLoading(true);

    try {
      let photoURL = '';
      
      if (photoUri) {
        photoURL = await uploadProfilePhoto();
      } else if (!user.photoURL) {
        photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          displayName.trim()
        )}&background=random`;
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        username: username.toLowerCase().trim(),
        bio: bio.trim(),
        photoURL: photoURL || user.photoURL,
        onboardingCompleted: true,
        followersCount: 0,
        followingCount: 0,
        followers: [],
        following: [],
        savedPosts: [],
      });

      await refreshUser();

      console.log('✅ Onboarding completed successfully');
      
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step}>
          {currentStep >= step ? (
            <LinearGradient
              colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.stepDot, styles.stepDotActive]}
            />
          ) : (
            <View style={styles.stepDot} />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons name="camera" size={40} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={styles.stepTitle}>Add a Profile Photo</Text>
            <Text style={styles.stepSubtitle}>Choose a photo that represents you</Text>
            
            <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
              {photoUri ? (
                <View style={styles.photoWrapper}>
                  <LinearGradient
                    colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.photoGradientBorder}
                  >
                    <Image source={{ uri: photoUri }} style={styles.profilePhoto} />
                  </LinearGradient>
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="images" size={50} color="#8E8E8E" />
                  <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCurrentStep(2)} style={styles.skipButton}>
              <MaskedView
                maskElement={
                  <Text style={styles.skipButtonText}>Skip for now</Text>
                }
              >
                <LinearGradient
                  colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={[styles.skipButtonText, { opacity: 0 }]}>Skip for now</Text>
                </LinearGradient>
              </MaskedView>
            </TouchableOpacity>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons name="person" size={40} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={styles.stepTitle}>What&apos;s your name?</Text>
            <Text style={styles.stepSubtitle}>This will be displayed on your profile</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#999"
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={50}
              autoFocus
            />
            
            <Text style={styles.helperText}>
              {displayName.length}/50 characters
            </Text>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons name="at" size={40} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={styles.stepTitle}>Choose a Username</Text>
            <Text style={styles.stepSubtitle}>
              You can use letters, numbers, underscores, and periods
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, usernameError && styles.inputError]}
                placeholder="username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={handleUsernameChange}
                maxLength={30}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
              {checkingUsername && (
                <ActivityIndicator
                  size="small"
                  color="#DD2A7B"
                  style={styles.inputIcon}
                />
              )}
              {!checkingUsername && username.length >= 3 && !usernameError && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color="#4CAF50"
                  style={styles.inputIcon}
                />
              )}
            </View>

            {usernameError && (
              <Text style={styles.errorText}>{usernameError}</Text>
            )}
            
            <Text style={styles.helperText}>
              {username.length}/30 characters
            </Text>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons name="create" size={40} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={styles.stepTitle}>Add a Bio</Text>
            <Text style={styles.stepSubtitle}>
              Tell people a little about yourself
            </Text>
            
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Bio (optional)"
              placeholderTextColor="#999"
              value={bio}
              onChangeText={setBio}
              maxLength={150}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />
            
            <Text style={styles.helperText}>
              {bio.length}/150 characters
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          {currentStep > 1 ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={26} color="#000" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
          
          <MaskedView
            maskElement={
              <Text style={styles.logo}>Framez</Text>
            }
          >
            <LinearGradient
              colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.logo, { opacity: 0 }]}>Framez</Text>
            </LinearGradient>
          </MaskedView>

          <View style={styles.headerSpacer} />
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        {renderStep()}

        {/* Next Button */}
        <TouchableOpacity
          style={[
            styles.nextButton,
            (loading || checkingUsername) && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={loading || checkingUsername}
        >
          <LinearGradient
            colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.nextButtonContent}>
                <Text style={styles.nextButtonText}>
                  {currentStep === 4 ? 'Complete Setup' : 'Next'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  logo: {
    fontSize: 28,
    fontFamily: 'Pacifico',
  },
  headerSpacer: {
    width: 42,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DBDBDB',
  },
  stepDotActive: {
    width: 32,
    height: 10,
    borderRadius: 5,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
  stepTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#262626',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  stepSubtitle: {
    fontSize: 15,
    color: '#8E8E8E',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  photoContainer: {
    marginBottom: 20,
  },
  photoWrapper: {},
  photoGradientBorder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    padding: 4,
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
  profilePhoto: {
    width: 152,
    height: 152,
    borderRadius: 76,
  },
  photoPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#DBDBDB',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E8E',
    fontWeight: '600',
  },
  skipButton: {
    padding: 12,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  inputContainer: {
    width: '100%',
    position: 'relative',
  },
  input: {
    width: '100%',
    height: 54,
    borderWidth: 1.5,
    borderColor: '#DBDBDB',
    borderRadius: 12,
    paddingHorizontal: 18,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#262626',
  },
  inputError: {
    borderColor: '#ED4956',
  },
  inputIcon: {
    position: 'absolute',
    right: 18,
    top: 15,
  },
  bioInput: {
    height: 130,
    paddingTop: 18,
  },
  helperText: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 10,
    alignSelf: 'flex-start',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 13,
    color: '#ED4956',
    marginTop: 10,
    alignSelf: 'flex-start',
    fontWeight: '600',
  },
  nextButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 'auto',
    marginBottom: 30,
    shadowColor: '#DD2A7B',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});