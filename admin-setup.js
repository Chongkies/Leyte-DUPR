// Import functions you need from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, where, doc, updateDoc, getDoc, addDoc, deleteDoc, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

// --- AUTHENTICATION CHECK ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log('User logged in:', user.email);
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('loggedInInfo').style.display = 'block';
        document.getElementById('loggedInEmail').textContent = user.email;
        document.getElementById('adminSetupSection').style.display = 'block';
        document.getElementById('currentAdminsSection').style.display = 'block';
        loadAdmins();
    } else {
        currentUser = null;
        console.log('No user logged in');
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('loggedInInfo').style.display = 'none';
        document.getElementById('adminSetupSection').style.display = 'none';
        document.getElementById('currentAdminsSection').style.display = 'none';
    }
});

// --- ADMIN LOGIN ---
function adminLogin() {
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log('Admin login successful:', userCredential.user.email);
            showSuccess('Logged in successfully!');
        })
        .catch((error) => {
            console.error('Login error:', error);
            let errorMessage = 'Login failed';
            
            switch(error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'Account has been disabled';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            alert('❌ ' + errorMessage);
        });
}

// Make adminLogin globally available
window.adminLogin = adminLogin;

// --- LOGOUT ---
function logout() {
    signOut(auth).then(() => {
        console.log('User logged out');
        document.getElementById('adminEmail').value = '';
        document.getElementById('adminPassword').value = '';
    }).catch((error) => {
        console.error('Logout error:', error);
    });
}

// Make logout globally available
window.logout = logout;

// --- GRANT ADMIN ACCESS ---
function grantAdminAccess() {
    if (!currentUser) {
        alert('Please login first');
        return;
    }
    
    const adminData = {
        email: currentUser.email,
        uid: currentUser.uid,
        role: 'admin',
        grantedAt: new Date(),
        grantedBy: currentUser.email, // Self-granted
        isActive: true,
        permissions: [
            'committee_management',
            'player_assessment',
            'match_logging',
            'user_management'
        ]
    };
    
    // Create or update admin document
    setDoc(doc(db, "admins", currentUser.uid), adminData)
        .then(() => {
            console.log('Admin access granted to:', currentUser.email);
            showSetupResult('✅ Admin access granted successfully!', 'success');
            
            // Also update user in committee collection if exists
            updateCommitteeAdminStatus(currentUser.email);
            
            // Refresh admin list
            loadAdmins();
        })
        .catch((error) => {
            console.error('Error granting admin access:', error);
            showSetupResult('❌ Error granting admin access: ' + error.message, 'error');
        });
}

// Make grantAdminAccess globally available
window.grantAdminAccess = grantAdminAccess;

// --- UPDATE COMMITTEE ADMIN STATUS ---
function updateCommitteeAdminStatus(email) {
    const committeeQuery = query(collection(db, "committee"), where("email", "==", email));
    
    getDocs(committeeQuery)
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                updateDoc(doc.ref, {
                    role: 'admin',
                    status: 'approved',
                    isAdmin: true,
                    updatedAt: new Date()
                }).then(() => {
                    console.log('Committee member updated to admin:', email);
                }).catch((error) => {
                    console.error('Error updating committee member:', error);
                });
            });
        })
        .catch((error) => {
            console.error('Error finding committee member:', error);
        });
}

// --- LOAD ADMINS ---
function loadAdmins() {
    const adminsQuery = query(collection(db, "admins"), orderBy("grantedAt", "desc"));
    
    getDocs(adminsQuery)
        .then((querySnapshot) => {
            const adminsList = document.getElementById('adminsList');
            
            if (querySnapshot.empty) {
                adminsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No admin accounts found</p>';
                return;
            }
            
            let adminsHTML = '<div style="display: grid; gap: 15px;">';
            
            querySnapshot.forEach((doc) => {
                const admin = doc.data();
                const isCurrentUser = admin.email === (currentUser ? currentUser.email : '');
                
                adminsHTML += `
                    <div style="padding: 15px; background: ${isCurrentUser ? '#e8f5e9' : '#f8f9fa'}; border: 2px solid ${isCurrentUser ? '#4caf50' : '#e9ecef'}; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="color: var(--text-primary);">${admin.email}</strong>
                                ${isCurrentUser ? '<span style="background: #4caf50; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; margin-left: 10px;">Current User</span>' : ''}
                                <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 5px;">
                                    Role: ${admin.role} | Granted: ${formatDate(admin.grantedAt)}
                                </div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 5px;">
                                    Permissions: ${admin.permissions ? admin.permissions.join(', ') : 'Full Access'}
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                ${admin.isActive ? 
                                    '<span style="color: #4caf50; font-weight: 600;">✅ Active</span>' : 
                                    '<span style="color: #f44336; font-weight: 600;">❌ Inactive</span>'
                                }
                            </div>
                        </div>
                    </div>
                `;
            });
            
            adminsHTML += '</div>';
            adminsList.innerHTML = adminsHTML;
        })
        .catch((error) => {
            console.error('Error loading admins:', error);
            document.getElementById('adminsList').innerHTML = '<p style="text-align: center; color: #f44336;">Error loading admin accounts</p>';
        });
}

// Make loadAdmins globally available
window.loadAdmins = loadAdmins;

// --- SHOW SETUP RESULT ---
function showSetupResult(message, type) {
    const resultDiv = document.getElementById('setupResult');
    resultDiv.innerHTML = `
        <div style="padding: 15px; border-radius: 8px; text-align: center; font-weight: 600; 
                    background: ${type === 'success' ? '#d4edda' : '#f8d7da'}; 
                    border: 2px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'}; 
                    color: ${type === 'success' ? '#155724' : '#721c24'};">
            ${message}
        </div>
    `;
    resultDiv.style.display = 'block';
}

// --- HELPER FUNCTIONS ---
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showSuccess(message) {
    // Simple success notification
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 600;
    `;
    successDiv.textContent = '✅ ' + message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}

// --- INITIALIZE ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Setup page loaded');
});
