import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';

export const toggleFollow = async (currentUserId: string, targetUserId: string) => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    // Get current user data to check if already following
    const currentUserDoc = await getDoc(currentUserRef);
    const currentUserData = currentUserDoc.data();
    const isFollowing = currentUserData?.following?.includes(targetUserId) || false;

    if (isFollowing) {
      // Unfollow
      await updateDoc(currentUserRef, {
        following: arrayRemove(targetUserId),
        followingCount: increment(-1)
      });

      await updateDoc(targetUserRef, {
        followers: arrayRemove(currentUserId),
        followersCount: increment(-1)
      });

      return { success: true, isFollowing: false };
    } else {
      // Follow
      await updateDoc(currentUserRef, {
        following: arrayUnion(targetUserId),
        followingCount: increment(1)
      });

      await updateDoc(targetUserRef, {
        followers: arrayUnion(currentUserId),
        followersCount: increment(1)
      });

      return { success: true, isFollowing: true };
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    return { success: false, isFollowing: false };
  }
};

export const checkIfFollowing = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    const currentUserDoc = await getDoc(currentUserRef);
    const currentUserData = currentUserDoc.data();
    
    return currentUserData?.following?.includes(targetUserId) || false;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
};