import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDVX9zXM8a2S7A4niNJZQqU5QcLX6M8qRw",
  authDomain: "gujtrip-2a55b.firebaseapp.com",
  databaseURL: "https://gujtrip-2a55b-default-rtdb.firebaseio.com",
  projectId: "gujtrip-2a55b",
  storageBucket: "gujtrip-2a55b.appspot.com",
  messagingSenderId: "370775504765",
  appId: "1:370775504765:web:595f3adb8f955edbb2be14",
  measurementId: "G-PCPKGPG8XD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database };