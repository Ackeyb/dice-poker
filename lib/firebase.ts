import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5nRbHVa0plp20Iktvt0uJr7GqXndwcoQ",
  authDomain: "dice-poker-a9b37.firebaseapp.com",
  projectId: "dice-poker-a9b37",
  storageBucket: "dice-poker-a9b37.firebasestorage.app",
  messagingSenderId: "246433202748",
  appId: "1:246433202748:web:11799e2aad3233851f7939",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);