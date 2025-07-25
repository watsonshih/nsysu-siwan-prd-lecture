// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
// 【核心修正】在這裡從 firebase/database 引入 child 和 push
import { getDatabase, ref, get, set, child, push } from "firebase/database";

// 您的 Firebase 設定物件 (維持不變)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化並匯出 Firebase 服務
export const auth = getAuth(app);
export const db = getDatabase(app);
export const provider = new GoogleAuthProvider();

// 【核心修正】在這一行將 child 和 push 加入到匯出列表中
export { signInWithPopup, signOut, ref, get, set, child, push };