// Import functions you need from Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

// --- AUTHENTICATION ---
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    
    // Control logout button visibility
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        if (user) {
            logoutBtn.style.display = 'inline-block';
        } else {
            logoutBtn.style.display = 'none';
        }
    }
    
    if (user) {
        console.log('User logged in:', user.email);
        // Check if user is approved committee member
        checkUserApproval(user);
    } else {
        console.log('No user logged in - showing public registration');
        // Hide any messages when user is logged out
        hideMessages();
    }
});

// --- CHECK USER APPROVAL ---
async function checkUserApproval(user) {
    try {
        const userDoc = await getDoc(doc(db, "user_roles", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.approved) {
                // User is approved - redirect to committee management
                window.location.href = 'committee-management.html';
            } else {
                // User is not approved - log them out and show registration
                console.log('User not approved - logging out and showing registration');
                await signOut(auth);
                // Show message about pending approval
                showError('Your account is pending approval. Please wait for an administrator to approve your registration.');
            }
        } else {
            // User role not found - log them out
            console.log('User role not found - logging out');
            await signOut(auth);
        }
    } catch (error) {
        console.error('Error checking user approval:', error);
        // On error, log out and show registration
        await signOut(auth);
    }
}

// --- HIDE MESSAGES ---
function hideMessages() {
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    if (errorMessage) errorMessage.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none';
}

// --- TERMS CHECKBOX HANDLING ---
document.addEventListener('DOMContentLoaded', function() {
    const agreeTermsCheckbox = document.getElementById('agreeTerms');
    const registerBtn = document.getElementById('registerBtn');
    
    if (agreeTermsCheckbox && registerBtn) {
        // Add event listener to checkbox
        agreeTermsCheckbox.addEventListener('change', function() {
            // Enable register button only if checkbox is checked
            registerBtn.disabled = !this.checked;
        });
        
        // Also validate all form fields when checkbox changes
        agreeTermsCheckbox.addEventListener('change', validateForm);
        
        // Add input event listeners to all form fields for real-time validation
        const formInputs = document.querySelectorAll('#registrationForm input[required]');
        formInputs.forEach(input => {
            input.addEventListener('input', validateForm);
            input.addEventListener('change', validateForm);
        });
        
        // Initial validation
        validateForm();
    }
});

// --- FORM VALIDATION ---
function validateForm() {
    const agreeTermsCheckbox = document.getElementById('agreeTerms');
    const registerBtn = document.getElementById('registerBtn');
    const formInputs = document.querySelectorAll('#registrationForm input[required]');
    
    if (!agreeTermsCheckbox || !registerBtn) return;
    
    // Check if all required fields are filled
    let allFieldsValid = true;
    formInputs.forEach(input => {
        if (input.type === 'checkbox') {
            if (!input.checked) allFieldsValid = false;
        } else {
            if (!input.value.trim()) allFieldsValid = false;
        }
    });
    
    // Enable register button only if all fields are valid
    registerBtn.disabled = !allFieldsValid;
}

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
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // Validation
    if (!name || !email || !password || !confirmPassword || !phone || !address || !municipality) {
        showError('Please fill in all required fields');
        return;
    }
    
    if (!agreeTerms) {
        showError('You must agree to the Committee Code of Integrity to register');
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
        console.log('Public committee member created:', userCredential.user.email);
        
        // Add user role to Firestore
        await setDoc(doc(db, "user_roles", userCredential.user.uid), {
            email: email,
            name: name,
            phone: phone,
            address: address,
            municipality: municipality,
            role: 'public-committee',
            createdAt: new Date(),
            approved: false, // Public committee members need admin approval
            adminCreated: false
        });
        
        // Add to committee_members collection
        await setDoc(doc(db, "committee_members", userCredential.user.uid), {
            name: name,
            email: email,
            phone: phone,
            address: address,
            municipality: municipality,
            role: 'public-committee',
            createdAt: new Date(),
            approved: false, // Public committee members need admin approval
            createdBy: currentUser ? currentUser.email : 'system'
        });
        
        // Show popup confirmation immediately (before logout)
        alert('✅ Registration Successful!\n\nYour committee member account has been created and is pending approval from an administrator.\n\nYou will be logged out and redirected to the home page.');
        
        // Show success message on page
        showSuccess('Public committee member registered successfully! Your account is pending approval from an administrator.');
        
        // Reset form fields immediately
        const form = document.getElementById('registrationForm');
        form.reset();
        
        // Clear any remaining input values manually
        document.getElementById('memberName').value = '';
        document.getElementById('memberEmail').value = '';
        document.getElementById('memberPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        document.getElementById('memberPhone').value = '';
        document.getElementById('memberAddress').value = '';
        
        console.log('Form fields cleared after registration');
        
        // Log out the user immediately after registration
        await signOut(auth);
        console.log('User logged out after registration');
        
        // Redirect to home after successful registration
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000); // Reduced delay since popup already provided confirmation
        
    } catch (error) {
        console.error('Registration error:', error);
        showError('Registration failed: ' + error.message);
    }
});

// --- UI FUNCTIONS ---
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = '❌ ' + message;
    errorMessage.style.display = 'block';
    
    // Hide success message
    const successMessage = document.getElementById('successMessage');
    successMessage.style.display = 'none';
}

function showSuccess(message) {
    const successMessage = document.getElementById('successMessage');
    successMessage.textContent = '✅ ' + message;
    successMessage.style.display = 'block';
    
    // Hide error message
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.style.display = 'none';
}
