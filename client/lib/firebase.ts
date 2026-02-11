// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBamHDDg53jHWKDG3o1-LpG6UaQ99xNHGU",
  authDomain: "acm-w-osu-website.firebaseapp.com",
  projectId: "acm-w-osu-website",
  storageBucket: "acm-w-osu-website.firebasestorage.app",
  messagingSenderId: "462748493343",
  appId: "1:462748493343:web:83bf9378365a15d48e172a",
  measurementId: "G-DMG1J9L9QM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);