import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import config from './firebase-applet-config.json';

// Default empty config to prevent crashes
const fallbackConfig = {
  apiKey: "demo-key",
  authDomain: "demo.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo.appspot.com",
  messagingSenderId: "000000000000",
  appId: "0:000000000000:web:000000000000",
};

let app;
const configWithType = config as any;

if (configWithType && configWithType.apiKey) {
  app = initializeApp(configWithType);
  console.log("Firebase initialized with project config");
} else {
  console.warn("Using demo Firebase configuration. Please set up Firebase in the UI.");
  app = getApps().length === 0 ? initializeApp(fallbackConfig) : getApp();
}

export const auth = getAuth(app);
export const db = getFirestore(app);
