
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJ5g7xPdMvFdZZFrSPSHjHDkkEf731mwg",
  authDomain: "karaokeranking.firebaseapp.com",
  databaseURL: "https://karaokeranking.firebaseio.com", // I've added the databaseURL based on your projectId
  projectId: "karaokeranking",
  storageBucket: "karaokeranking.firebasestorage.app",
  messagingSenderId: "497146914900",
  appId: "1:497146914900:web:a217efaf2ddc8d328ba5c1",
  measurementId: "G-4DX4D9VE3J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
