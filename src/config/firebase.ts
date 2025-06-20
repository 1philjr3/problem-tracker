// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// Для демонстрации - замените на ваши реальные данные

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDbjPRbpsnNy3qfHcLMKlH9UxYW8pMsSwQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "quiz-981ac.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "quiz-981ac",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "quiz-981ac.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1070106055281",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1070106055281:web:ac88fadc103fd7c5a481d0",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-2J095RKCG0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app; 