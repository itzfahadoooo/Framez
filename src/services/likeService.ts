import { doc, updateDoc, arrayUnion, arrayRemove, increment, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const toggleLike = async (postId: string, userId: string): Promise<{ success: boolean; isLiked: boolean }> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const userRef = doc(db, 'users', userId);
    
    // Get current state
    const postDoc = await getDoc(postRef);
    const postData = postDoc.data();
    const isCurrentlyLiked = postData?.likedBy?.includes(userId) || false;

    if (isCurrentlyLiked) {
      // Unlike
      await updateDoc(postRef, {
        likes: increment(-1),
        likedBy: arrayRemove(userId)
      });
      await updateDoc(userRef, {
        likedPosts: arrayRemove(postId)
      });
      return { success: true, isLiked: false };
    } else {
      // Like
      await updateDoc(postRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId)
      });
      await updateDoc(userRef, {
        likedPosts: arrayUnion(postId)
      });
      return { success: true, isLiked: true };
    }
  } catch (error: any) {
    console.error('Toggle like error:', error);
    return { success: false, isLiked: false };
  }
};

export const toggleBookmark = async (postId: string, userId: string): Promise<{ success: boolean; isSaved: boolean }> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Get current state
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    const isCurrentlySaved = userData?.savedPosts?.includes(postId) || false;

    if (isCurrentlySaved) {
      // Remove bookmark
      await updateDoc(userRef, {
        savedPosts: arrayRemove(postId)
      });
      return { success: true, isSaved: false };
    } else {
      // Add bookmark
      await updateDoc(userRef, {
        savedPosts: arrayUnion(postId)
      });
      return { success: true, isSaved: true };
    }
  } catch (error: any) {
    console.error('Toggle bookmark error:', error);
    return { success: false, isSaved: false };
  }
};