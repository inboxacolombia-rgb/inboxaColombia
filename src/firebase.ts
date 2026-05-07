import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

let db: any;
let auth: any;

const initFirebase = async () => {
  try {
    // @ts-ignore
    const firebaseConfig = await import('./firebase-applet-config.json');
    
    const app = initializeApp(firebaseConfig.default);
    db = getFirestore(app, firebaseConfig.default.firestoreDatabaseId);
    auth = getAuth(app);

    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("Firebase connected successfully");
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  } catch (e) {
    console.warn("Firebase config not found. Please complete the setup in the UI.");
  }
};

initFirebase();

export { db, auth };
