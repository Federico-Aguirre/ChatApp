// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "@firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAzJkSoYIS3nKqn426mB29hwOJysF5s4Rc",
  authDomain: "chata-53320.firebaseapp.com",
  projectId: "chata-53320",
  storageBucket: "chata-53320.appspot.com",
  messagingSenderId: "547736538191",
  appId: "1:547736538191:web:01a6c5d20716aa87a2ee3a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();