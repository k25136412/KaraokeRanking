// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

// Your web app's Firebase configuration
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

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const database = getDatabase(app);
export const storage = getStorage(app);

export { app, database };

export const uploadScoreImage = async (participantId: string, songNumber: number, base64Image: string): Promise<string> => {
  const storageRef = ref(storage, `scores/${participantId}_song${songNumber}_${Date.now()}.jpg`);
  // ★修正：'data_url' を使うことで、「これは画像ですよ」という情報ごとアップロードされます
  const result = await uploadString(storageRef, base64Image, 'data_url');
  return await getDownloadURL(result.ref);
};