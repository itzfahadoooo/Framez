import { CLOUDINARY_CONFIG } from '../config/cloudinary';
import { UploadResult } from '../types';
import { Platform } from 'react-native';

export const uploadImageToCloudinary = async (imageUri: string): Promise<UploadResult> => {
  try {
    // For web platform, we need to fetch the image as a blob first
    let formData: any;
    
    if (Platform.OS === 'web') {
      // Web-specific upload
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      formData = new FormData();
      formData.append('file', blob);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      formData.append('folder', 'framez');
    } else {
      // Mobile (iOS/Android) upload
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData = new FormData();
      // @ts-ignore - React Native handles this correctly
      formData.append('file', {
        uri: imageUri,
        type: type,
        name: filename,
      });
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      formData.append('folder', 'framez');
    }

    const uploadResponse = await fetch(CLOUDINARY_CONFIG.apiUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await uploadResponse.json();

    console.log('Cloudinary upload response:', data);
    
    if (data.secure_url) {
      return {
        success: true,
        url: data.secure_url,
        publicId: data.public_id
      };
    } else {
      return {
        success: false,
        error: data.error?.message || 'Upload failed'
      };
    }
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};