// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "@firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAfJmBs5Cgzeku_hjUYR1Urg9Z2il9HIKY",
  authDomain: "chatapp-6e231.firebaseapp.com",
  projectId: "chatapp-6e231",
  storageBucket: "chatapp-6e231.appspot.com",
  messagingSenderId: "428716297216",
  appId: "1:428716297216:web:94cb955dc1ecaf29ff1ce5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();