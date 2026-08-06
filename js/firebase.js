// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyAIII3nb_vpsDrWA2ObYuwOE3I2XXdzQiM",
    authDomain: "kaizen-habit-tracker-36453.firebaseapp.com",
    projectId: "kaizen-habit-tracker-36453",
    storageBucket: "kaizen-habit-tracker-36453.firebasestorage.app",
    messagingSenderId: "263873833982",
    appId: "1:263873833982:web:4ce4690b70bcec677baeaf",
    measurementId: "G-1YGCKZTLL8"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();
