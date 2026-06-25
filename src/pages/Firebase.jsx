// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCY4mKY0d57qc7D3Rkqmsx9dp8uMhRo53c",
  authDomain: "auth-12-06-2007.firebaseapp.com",
  projectId: "auth-12-06-2007",
  storageBucket: "auth-12-06-2007.firebasestorage.app",
  messagingSenderId: "340342549665",
  appId: "1:340342549665:web:a8af36a4b10f24150614e0",
  measurementId: "G-ED7DVH163T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export default app;