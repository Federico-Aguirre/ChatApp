// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "@firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC4dgZtrDyNjiRF-6XmCHvEFMMUEH9gsoE",
  authDomain: "chatapp-105ff.firebaseapp.com",
  projectId: "chatapp-105ff",
  storageBucket: "chatapp-105ff.appspot.com",
  messagingSenderId: "51093108686",
  appId: "1:51093108686:web:20c5cc9cdaab4e31c2dd9f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();