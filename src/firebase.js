
// Replace the values below with your Firebase project config from the Firebase Console
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCQHuYGOtxlftD-Nzi6dhRLZMXzyc1e2G8",
  authDomain: "jyajce-2a942.firebaseapp.com",
  projectId: "jyajce-2a942",
  storageBucket: "jyajce-2a942.firebasestorage.app",
  messagingSenderId: "410784091106",
  appId: "1:410784091106:web:a99c438904dbaaa9a247bb"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
