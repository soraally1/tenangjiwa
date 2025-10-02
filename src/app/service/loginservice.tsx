import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  User,
  UserCredential 
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface LogoutResult {
  success: boolean;
  error?: string;
}

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Date;
  lastLoginAt: Date;
}

// Email and Password Login
export const loginWithEmail = async (email: string, password: string): Promise<LoginResult> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Update or create user data in Firestore (non-blocking)
    try {
      const userRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Update last login time for existing users
        await setDoc(userRef, {
          lastLoginAt: new Date()
        }, { merge: true });
        console.log('✓ User login time updated in Firestore');
      } else {
        // Create user document if it doesn't exist (legacy users)
        const userData: UserData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email!,
          displayName: userCredential.user.displayName || 'User',
          photoURL: userCredential.user.photoURL || null,
          createdAt: new Date(),
          lastLoginAt: new Date()
        };
        await setDoc(userRef, userData);
        console.log('✓ User data created in Firestore');
      }
    } catch (firestoreError) {
      console.error('Firestore error (login still successful):', firestoreError);
      // Login succeeds even if Firestore fails
    }
    
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
    
    // Update or create user data in Firestore (non-blocking)
    try {
      console.log('Attempting to save user to Firestore...');
      const userRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Update last login time for existing users
        await setDoc(userRef, {
          lastLoginAt: new Date()
        }, { merge: true });
        console.log('✓ User login time updated in Firestore');
      } else {
        // Create user document if it doesn't exist (new users)
        const userData: UserData = {
          uid: result.user.uid,
          email: result.user.email!,
          displayName: result.user.displayName || 'User',
          photoURL: result.user.photoURL || null,
          createdAt: new Date(),
          lastLoginAt: new Date()
        };
        await setDoc(userRef, userData);
        console.log('✓ New user data created in Firestore:', userData);
      }
    } catch (firestoreError) {
      console.error('❌ Firestore error (login still successful):', firestoreError);
      // Login succeeds even if Firestore fails
    }
    
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
