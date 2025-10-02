import { 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  updateProfile,
  User,
  UserCredential
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

export interface SignupResult {
  success: boolean;
  user?: User;
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

// Email and Password Signup
export const signupWithEmail = async (
  name: string, 
  email: string, 
  password: string
): Promise<SignupResult> => {
  try {
    // Create user with email and password
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update user profile with display name
    await updateProfile(userCredential.user, {
      displayName: name
    });

    // Save user data to Firestore (non-blocking)
    try {
      console.log('Attempting to save new user to Firestore...');
      const userData: UserData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName: name,
        photoURL: userCredential.user.photoURL || null,
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      console.log('✓ New user saved to Firestore:', userData);
    } catch (firestoreError) {
      console.error('❌ Firestore error (signup still successful):', firestoreError);
      // Signup succeeds even if Firestore fails
    }

    return {
      success: true,
      user: userCredential.user
    };
  } catch (error: unknown) {
    let errorMessage = 'Terjadi kesalahan saat mendaftar';
    
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email sudah digunakan';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Format email tidak valid';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password terlalu lemah. Minimal 6 karakter';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operasi tidak diizinkan';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Koneksi internet bermasalah';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Google Signup (same as Google Login)
export const signupWithGoogle = async (): Promise<SignupResult> => {
  try {
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    
    // Check if this is a new user
    const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
    
    // Save/update user data in Firestore (non-blocking)
    try {
      console.log('Attempting to save Google user to Firestore...', { isNewUser });
      
      if (isNewUser) {
        // Save user data to Firestore for new users
        const userData: UserData = {
          uid: result.user.uid,
          email: result.user.email!,
          displayName: result.user.displayName || 'User',
          photoURL: result.user.photoURL || null,
          createdAt: new Date(),
          lastLoginAt: new Date()
        };

        await setDoc(doc(db, 'users', result.user.uid), userData);
        console.log('✓ New Google user saved to Firestore:', userData);
      } else {
        // Update last login for existing users
        await setDoc(doc(db, 'users', result.user.uid), {
          lastLoginAt: new Date()
        }, { merge: true });
        console.log('✓ Existing user login time updated');
      }
    } catch (firestoreError) {
      console.error('❌ Firestore error (signup still successful):', firestoreError);
      // Signup succeeds even if Firestore fails
    }

    return {
      success: true,
      user: result.user
    };
  } catch (error: unknown) {
    let errorMessage = 'Terjadi kesalahan saat mendaftar dengan Google';
    
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Pendaftaran dibatalkan';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup diblokir oleh browser';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Pendaftaran dibatalkan';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Koneksi internet bermasalah';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Validate password strength
export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 6) {
    return {
      isValid: false,
      message: 'Password minimal 6 karakter'
    };
  }
  
  if (password.length > 128) {
    return {
      isValid: false,
      message: 'Password maksimal 128 karakter'
    };
  }
  
  return { isValid: true };
};

// Validate email format
export const validateEmail = (email: string): { isValid: boolean; message?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      message: 'Format email tidak valid'
    };
  }
  
  return { isValid: true };
};

// Validate name
export const validateName = (name: string): { isValid: boolean; message?: string } => {
  if (name.trim().length < 2) {
    return {
      isValid: false,
      message: 'Nama minimal 2 karakter'
    };
  }
  
  if (name.trim().length > 50) {
    return {
      isValid: false,
      message: 'Nama maksimal 50 karakter'
    };
  }
  
  return { isValid: true };
};
