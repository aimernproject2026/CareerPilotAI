
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"


// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
//   authDomain: "interviewiq-ba6ba.firebaseapp.com",
//   projectId: "interviewiq-ba6ba",
//   storageBucket: "interviewiq-ba6ba.firebasestorage.app",
//   messagingSenderId: "862159592601",
//   appId: "1:862159592601:web:7308d702cd708076ddec08"
// };


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "careerpilotai-5c898.firebaseapp.com",
  projectId: "careerpilotai-5c898",
  storageBucket: "careerpilotai-5c898.firebasestorage.app",
  messagingSenderId: "735869684046",
  appId: "1:735869684046:web:3fd7272fd3442a5a44f61f"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider()

export {auth , provider}