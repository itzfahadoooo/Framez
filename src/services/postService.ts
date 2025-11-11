import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  where,
  doc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Post, PostResult, PostsResult } from '../types';

export const createPost = async (
  userId: string,
  userName: string,
  userPhoto: string,
  caption: string,
  imageUrl: string
): Promise<PostResult> => {
  try {
    const postData = {
      userId,
      userName,
      userPhoto,
      caption,
      imageUrl,
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'posts'), postData);
    
    // Update user's post count
    await updateDoc(doc(db, 'users', userId), {
      postsCount: increment(1)
    });

    return { success: true, postId: docRef.id };
  } catch (error: any) {
    console.error('Error creating post:', error);
    return { success: false, error: error.message };
  }
};

export const getAllPosts = async (): Promise<PostsResult> => {
  try {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const posts: Post[] = [];
    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() } as Post);
    });

    return { success: true, posts };
  } catch (error: any) {
    console.error('Error getting posts:', error);
    return { success: false, error: error.message, posts: [] };
  }
};

export const getUserPosts = async (userId: string): Promise<PostsResult> => {
  try {
    const q = query(
      collection(db, 'posts'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const posts: Post[] = [];
    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() } as Post);
    });

    return { success: true, posts };
  } catch (error: any) {
    console.error('Error getting user posts:', error);
    return { success: false, error: error.message, posts: [] };
  }
};