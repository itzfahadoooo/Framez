export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  username: string;
  bio?: string;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  likedPosts?: string[];
  savedPosts?: string[];  
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  caption: string;
  imageUrl: string;
  likes: number;
  likedBy: string[];
  comments: any[];
  createdAt: string;
  commentsCount?: number;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string, username: string) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
  refreshUser: () => Promise<void>;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface PostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

export interface PostsResult {
  success: boolean;
  posts: Post[];
  error?: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  createdAt: string;
}