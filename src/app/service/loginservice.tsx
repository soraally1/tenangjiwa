import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  User,
  UserCredential 
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth, googleProvider } from './firebase';

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface LogoutResult {
  success: boolean;
  error?: string;
}

// Email and Password Login
export const loginWithEmail = async (email: string, password: string): Promise<LoginResult> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error: unknown) {
    let errorMessage = 'Terjadi kesalahan saat login';
    
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as FirebaseError).code;
      switch (code) {
        case 'auth/user-not-found':
          errorMessage = 'Email tidak ditemukan';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Password salah';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Format email tidak valid';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Akun ini telah dinonaktifkan';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Terlalu banyak percobaan login. Coba lagi nanti';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Koneksi internet bermasalah';
          break;
        default:
          errorMessage = error instanceof Error ? error.message : errorMessage;
      }
    } else {
      errorMessage = error instanceof Error ? error.message : errorMessage;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Google Login
export const loginWithGoogle = async (): Promise<LoginResult> => {
  try {
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    return {
      success: true,
      user: result.user
    };
  } catch (error: unknown) {
    let errorMessage = 'Terjadi kesalahan saat login dengan Google';
    
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as FirebaseError).code;
      switch (code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Login dibatalkan';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup diblokir oleh browser';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Login dibatalkan';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Koneksi internet bermasalah';
          break;
        default:
          errorMessage = error instanceof Error ? error.message : errorMessage;
      }
    } else {
      errorMessage = error instanceof Error ? error.message : errorMessage;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Logout
export const logout = async (): Promise<LogoutResult> => {
  try {
    await signOut(auth);
    return {
      success: true
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: (error instanceof Error ? error.message : 'Terjadi kesalahan saat logout')
    };
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!auth.currentUser;
};
