// Import functions you need from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCnl3qwdiN6bRGgiAi9BV8zHDNMaNcMD5M",
  authDomain: "leyte-dupr.firebaseapp.com",
  projectId: "leyte-dupr",
  storageBucket: "leyte-dupr.firebasestorage.app",
  messagingSenderId: "815242573035",
  appId: "1:815242573035:web:967f4dba971497d2f2faae",
  measurementId: "G-E2T8F18GB8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- GLOBAL VARIABLES ---
let currentUser = null;

// --- ADD COURT FUNCTION ---
window.addCourt = async function(e) {
    e.preventDefault();
    
    const courtName = document.getElementById('courtName').value.trim();
    const municipality = document.getElementById('municipality').value;
    
    if (!courtName || !municipality) {
        alert("Please fill in all required fields");
        return;
    }
    
    try {
        await addDoc(collection(db, "courts"), {
            name: courtName,
            municipality: municipality,
            createdAt: new Date(),
            addedBy: currentUser.email
        });
        
        alert("Court added successfully!");
        document.getElementById('addCourtForm').reset();
        
        // Redirect back to assessment page
        setTimeout(() => {
            window.location.href = 'assessment.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error adding court:', error);
        alert("Failed to add court: " + error.message);
    }
};

// --- LOGOUT FUNCTION ---
window.logout = function() {
    signOut(auth).then(() => {
        console.log('User logged out successfully');
        alert("Logged Out Successfully!");
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Logout error:', error);
        alert("Error logging out: " + error.message);
    });
};

// --- AUTH STATE LISTENER ---
onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed - User:', user ? user.email : 'null');
    currentUser = user;
    
    if (!user) {
        // User not logged in, redirect to assessment page
        window.location.href = 'assessment.html';
    }
    
    // Show/hide logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.style.display = user ? 'inline-block' : 'none';
    }
});

// --- DOM READY ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('Add Court page loaded');
    
    // Add form submit listener
    const form = document.getElementById('addCourtForm');
    if (form) {
        form.addEventListener('submit', addCourt);
    }
});
