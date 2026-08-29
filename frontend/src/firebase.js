import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCZRu4CNwGRW8B_baAWt0wEdgl2ZByWhKs",
  authDomain: "cgm-cts.firebaseapp.com",
  databaseURL: "https://cgm-cts-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cgm-cts",
  storageBucket: "cgm-cts.firebasestorage.app",
  messagingSenderId: "240074058519",
  appId: "1:240074058519:web:c9c2a0f5483cbc4e8ba552",
  measurementId: "G-6B619C1Z9Q"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
