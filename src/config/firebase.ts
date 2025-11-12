import { initializeApp } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
// @ts-ignore: getReactNativePersistence exists in the RN bundle 
// but is often missing from public TypeScript definitions.
import { initializeAuth, getReactNativePersistence, Auth, browserLocalPersistence } from 'firebase/auth';

// ✅ Get Firebase config from Constants instead of process.env
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId,
  measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId
};

// ✅ Validate required config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Firebase config:', firebaseConfig);
  throw new Error('Firebase configuration is missing. Check your app.config.ts and .env file.');
}

const app = initializeApp(firebaseConfig);

// ✅ Use platform-specific persistence
export const auth: Auth = initializeAuth(app, {
  persistence: Platform.OS === 'web' 
    ? browserLocalPersistence 
    : getReactNativePersistence(AsyncStorage)
});

export const db: Firestore = getFirestore(app);

// ✅ Export storage instance
export const storage: FirebaseStorage = getStorage(app);