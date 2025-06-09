import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';


import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCa8N97oFB4kMiUmRJWhr1vxwtzmdtrOcI",
  authDomain: "electro-ecommerce-pfc.firebaseapp.com",
  projectId: "electro-ecommerce-pfc",
  storageBucket: "electro-ecommerce-pfc.firebasestorage.app",
  messagingSenderId: "812469689377",
  appId: "1:812469689377:web:741aca83d6f94cecf65760"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
  
// Import the functions you need from the SDKs you need
