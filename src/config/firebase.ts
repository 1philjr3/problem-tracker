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
  apiKey: "AIzaSyC5lKFznAWAONxV6hVQ-5qu7lbBDa9VFIE",
  authDomain: "quiz-5b2f2.firebaseapp.com",
  projectId: "quiz-5b2f2",
  storageBucket: "quiz-5b2f2.firebasestorage.app",
  messagingSenderId: "485460821593",
  appId: "1:485460821593:web:a3e8f7b5e3a7a4b7cfdcaa"
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