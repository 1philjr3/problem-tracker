import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  type User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User ${user.uid}` : 'No user');
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 