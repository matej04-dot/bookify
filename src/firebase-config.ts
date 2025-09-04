// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {getFirestore} from "firebase/firestore"

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBCeRqrD_ohr7Bze8Wl7oU_RQUbcbN-fxs",
  authDomain: "bookify-79744.firebaseapp.com",
  projectId: "bookify-79744",
  storageBucket: "bookify-79744.firebasestorage.app",
  messagingSenderId: "895999662926",
  appId: "1:895999662926:web:7b2ac2eece6164bf415c1f",
  measurementId: "G-NH7M9RGXBX"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);