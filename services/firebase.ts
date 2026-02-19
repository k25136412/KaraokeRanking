// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // ← AnalyticsではなくDatabaseを読み込みます
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAxmQ1KxSCehnor21IC_425fezsafBvxTs",
  authDomain: "karaokeranking.firebaseapp.com",
  databaseURL: "https://karaokeranking-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "karaokeranking",
  storageBucket: "karaokeranking.firebasestorage.app",
  messagingSenderId: "497146914900",
  appId: "1:497146914900:web:a0bbd28dc60168648ba5c1",
  measurementId: "G-BKLD05781P"
};

// Firebaseとデータベースの初期化
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };