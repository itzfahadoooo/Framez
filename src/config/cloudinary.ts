import Constants from 'expo-constants';

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiUrl: string;
}

// ✅ Get Cloudinary config from Constants instead of process.env
const cloudName = Constants.expoConfig?.extra?.cloudinaryCloudName;
const uploadPreset = Constants.expoConfig?.extra?.cloudinaryUploadPreset;

// ✅ Validate required config
if (!cloudName || !uploadPreset) {
  console.error('Cloudinary config:', { cloudName, uploadPreset });
  throw new Error('Cloudinary configuration is missing. Check your app.config.ts and .env file.');
}

export const CLOUDINARY_CONFIG: CloudinaryConfig = {
  cloudName,
  uploadPreset,
  apiUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
};