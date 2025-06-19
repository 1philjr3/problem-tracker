import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  type User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Функция для получения профиля пользователя из Firestore
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          id: userId,
          email: data.email,
          fullName: data.fullName,
          points: data.points || 0,
          level: data.level || 'novice',
          answersCount: data.answersCount || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          isAdmin: data.isAdmin || false
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Функция для создания дефолтного профиля
  const createDefaultProfile = (user: FirebaseUser, fullName: string): User => {
    return {
      id: user.uid,
      email: user.email || '',
      fullName: fullName,
      points: 0,
      level: 'novice',
      answersCount: 0,
      createdAt: new Date(),
      isAdmin: false
    };
  };

  // Функция входа
  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Функция регистрации
  const register = async (email: string, password: string, fullName: string) => {
    try {
      console.log('Attempting registration for:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('User created:', user.uid);
      
      // Создаем профиль пользователя в Firestore
      const userProfileData: Omit<User, 'id'> = {
        email,
        fullName,
        points: 0,
        level: 'novice',
        answersCount: 0,
        createdAt: new Date(),
        isAdmin: false
      };
      
      try {
        await setDoc(doc(db, 'users', user.uid), userProfileData);
        console.log('User profile created in Firestore');
      } catch (firestoreError) {
        console.warn('Failed to create Firestore profile, using local profile:', firestoreError);
        // Если не удалось создать в Firestore, создаем локальный профиль
        setUserProfile(createDefaultProfile(user, fullName));
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  // Функция выхода
  const logout = async () => {
    try {
      await signOut(auth);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  // Функция обновления профиля пользователя
  const updateUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) throw new Error('No authenticated user');
    
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), updates);
      
      // Обновляем локальное состояние
      if (userProfile) {
        setUserProfile({ ...userProfile, ...updates });
      }
    } catch (error) {
      console.warn('Failed to update Firestore, updating locally:', error);
      // Если не удалось обновить в Firestore, обновляем локально
      if (userProfile) {
        setUserProfile({ ...userProfile, ...updates });
      }
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User ${user.uid}` : 'No user');
      setCurrentUser(user);
      
      if (user) {
        console.log('Fetching user profile...');
        const profile = await fetchUserProfile(user.uid);
        
        if (profile) {
          console.log('User profile loaded from Firestore:', profile);
          setUserProfile(profile);
        } else {
          // Если профиль не найден в Firestore, создаем дефолтный
          console.log('Creating default profile');
          const defaultProfile = createDefaultProfile(user, user.displayName || 'Пользователь');
          setUserProfile(defaultProfile);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 