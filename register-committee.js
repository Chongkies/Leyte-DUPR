// Import functions you need from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

// --- REGISTER COMMITTEE FUNCTION ---
window.registerCommittee = async function(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('role').value;
    
    if (!fullName || !email || !password || !role) {
        alert("Please fill in all fields");
        return;
    }
    
    if (password.length < 6) {
        alert("Password must be at least 6 characters long");
        return;
    }
    
    try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Save user role to Firestore
        await setDoc(doc(db, "user_roles", user.uid), {
            name: fullName,
            email: email,
            role: role,
            createdAt: new Date(),
            approved: false, // Admin approval required
            registeredBy: currentUser.email
        });
        
        alert("Registration successful! The new member can now log in after admin approval.");
        document.getElementById('registerForm').reset();
        
        // Redirect back to assessment page
        setTimeout(() => {
            window.location.href = 'assessment.html';
        }, 2000);
        
    } catch (error) {
        console.error('Registration failed:', error);
        if (error.code === 'auth/email-already-in-use') {
            alert("This email is already registered. Please use a different email.");
        } else if (error.code === 'auth/weak-password') {
            alert("Password is too weak. Please choose a stronger password.");
        } else {
            alert("Registration Failed: " + error.message);
        }
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
    console.log('Register Committee page loaded');
    
    // Add form submit listener
    const form = document.getElementById('registerForm');
    if (form) {
        form.addEventListener('submit', registerCommittee);
    }
});
