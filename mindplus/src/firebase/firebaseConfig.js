import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCYrVKFHekfHTFQtgEwBNiiw9JXWk5lrkU",
  authDomain: "mindplus-368e3.firebaseapp.com",
  projectId: "mindplus-368e3",
  storageBucket: "mindplus-368e3.firebasestorage.app",
  messagingSenderId: "775907809751",
  appId: "1:775907809751:web:9ab32f0ea5bd1f6ae9d392",
  measurementId: "G-JEJECVRN3G"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
