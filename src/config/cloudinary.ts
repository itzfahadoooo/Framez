export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiUrl: string;
}

// ✅ Get Cloudinary config from environment variables
const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// ✅ Validate required config
if (!cloudName || !uploadPreset) {
  throw new Error('Cloudinary configuration is missing. Check your .env file.');
}

export const CLOUDINARY_CONFIG: CloudinaryConfig = {
  cloudName,
  uploadPreset,
  apiUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
};