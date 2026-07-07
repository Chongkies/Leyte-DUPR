// Import the functions you need from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
let selectedRole = 'committee';

// --- AUTHENTICATION ---
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    
    if (user) {
        console.log('Admin logged in:', user.email);
        
        // Check if user is admin
        checkAdminStatus(user);
    } else {
        console.log('No user logged in');
        showLoginRequired();
    }
});

// --- CHECK ADMIN STATUS ---
async function checkAdminStatus(user) {
    try {
        const userDoc = await getDoc(doc(db, "user_roles", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === 'admin') {
                console.log('User is admin - showing registration panel');
                showRegistrationPanel();
            } else {
                console.log('User is not admin - showing access denied');
                showAccessDenied();
            }
        } else {
            console.log('User role not found - showing access denied');
            showAccessDenied();
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
        showAccessDenied();
    }
}

// --- UI FUNCTIONS ---
function showLoginRequired() {
    document.getElementById('loginRequired').style.display = 'flex';
    document.getElementById('registrationPanel').style.display = 'none';
    hideMessages();
}

function showRegistrationPanel() {
    document.getElementById('loginRequired').style.display = 'none';
    document.getElementById('registrationPanel').style.display = 'block';
    hideMessages();
}

function showAccessDenied() {
    document.getElementById('loginRequired').style.display = 'flex';
    document.getElementById('registrationPanel').style.display = 'none';
    
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = '❌ Access Denied: Only administrators can register new committee members.';
    errorMessage.style.display = 'block';
    hideMessages();
}

function hideMessages() {
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
}

function showSuccess(message) {
    const successMessage = document.getElementById('successMessage');
    successMessage.textContent = '✅ ' + message;
    successMessage.style.display = 'block';
    hideMessages();
}

// --- ROLE SELECTION ---
window.selectRole = function(role) {
    selectedRole = role;
    
    // Update UI to show selected role
    const roleOptions = document.querySelectorAll('.role-option');
    roleOptions.forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selected class to clicked option
    event.target.closest('.role-option').classList.add('selected');
    
    console.log('Selected role:', role);
};

// --- ADMIN LOGIN ---
window.adminLogin = async function() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Admin login successful:', userCredential.user.email);
        
        // Clear login form
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        
        // Check admin status and show registration panel
        await checkAdminStatus(userCredential.user);
        
    } catch (error) {
        console.error('Admin login error:', error);
        alert('Login failed: ' + error.message);
    }
};

// --- REGISTRATION ---
document.getElementById('registrationForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const name = document.getElementById('memberName').value.trim();
    const email = document.getElementById('memberEmail').value.trim();
    const password = document.getElementById('memberPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const phone = document.getElementById('memberPhone').value.trim();
    const address = document.getElementById('memberAddress').value.trim();
    const municipality = document.getElementById('memberMunicipality').value;
    
    // Validation
    if (!name || !email || !password || !confirmPassword || !phone || !address || !municipality || !selectedRole) {
        showError('Please fill in all required fields and select a registration type');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Committee member created:', userCredential.user.email);
        
        // Determine approval status based on role
        let approved = false;
        let adminCreated = false;
        
        if (selectedRole === 'admin') {
            approved = true; // Admins are auto-approved
            adminCreated = true;
        } else if (selectedRole === 'committee') {
            approved = false; // Committee members need admin approval
        } else if (selectedRole === 'public-committee') {
            approved = false; // Public committee members need admin approval
        }
        
        // Add user role to Firestore
        await setDoc(doc(db, "user_roles", userCredential.user.uid), {
            email: email,
            name: name,
            phone: phone,
            address: address,
            municipality: municipality,
            role: selectedRole,
            createdAt: new Date(),
            approved: approved,
            adminCreated: adminCreated
        });
        
        // Add to appropriate collection
        if (selectedRole === 'admin' || selectedRole === 'committee' || selectedRole === 'public-committee') {
            // Add to committee_members collection
            await setDoc(doc(db, "committee_members", userCredential.user.uid), {
                name: name,
                email: email,
                phone: phone,
                address: address,
                municipality: municipality,
                role: selectedRole,
                createdAt: new Date(),
                approved: approved,
                createdBy: currentUser ? currentUser.email : 'system'
            });
        }
        
        // Show success message
        let successMessage = `Committee member registered successfully! Role: ${selectedRole}`;
        if (!approved) {
            successMessage += ' - Your account is pending approval from an administrator.';
        }
        
        showSuccess(successMessage);
        
        // Reset form
        document.getElementById('registrationForm').reset();
        selectedRole = null;
        
        // Update role selection UI
        document.querySelectorAll('.role-option').forEach(option => {
            option.classList.remove('selected');
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        showError('Registration failed: ' + error.message);
    }
});

// --- LOGOUT ---
window.logout = async function() {
    try {
        await signOut(auth);
        console.log('Logged out successfully');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out: ' + error.message);
    }
};
