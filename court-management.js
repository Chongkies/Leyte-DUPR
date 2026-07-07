// Import functions you need from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, where, doc, updateDoc, getDoc, addDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
let isAdmin = false;
let courts = [];
let deleteTargetId = null;

// --- AUTHENTICATION CHECK ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log('User logged in:', user.email);
        
        // Check if user is admin
        checkAdminStatus(user).then((isUserAdmin) => {
            isAdmin = isUserAdmin;
            
            if (isUserAdmin) {
                console.log('Admin logged in:', user.email);
                document.getElementById('loginRequired').style.display = 'none';
                document.getElementById('adminPanel').style.display = 'block';
                loadCourts();
                
                // Show admin-only buttons
                showAdminButtons();
            } else {
                console.log('User is not admin:', user.email);
                isAdmin = false;
                document.getElementById('loginRequired').style.display = 'flex';
                document.getElementById('adminPanel').style.display = 'none';
                
                // Hide admin-only buttons
                hideAdminButtons();
            }
        });
        
    } else {
        currentUser = null;
        isAdmin = false;
        console.log('No user logged in');
        document.getElementById('loginRequired').style.display = 'flex';
        document.getElementById('adminPanel').style.display = 'none';
        
        // Hide admin buttons when logged out
        hideAdminButtons();
    }
});

// --- CHECK ADMIN STATUS ---
async function checkAdminStatus(user) {
    try {
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            return adminData.isActive === true;
        }
        
        // Also check user_roles collection for admin role
        const committeeQuery = query(collection(db, "user_roles"), where("email", "==", user.email), where("role", "==", "admin"));
        const committeeSnapshot = await getDocs(committeeQuery);
        return !committeeSnapshot.empty;
        
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// --- LOGOUT FUNCTION ---
function logout() {
    signOut(auth).then(() => {
        console.log('User logged out');
        window.location.href = 'assessment.html';
    }).catch((error) => {
        console.error('Logout error:', error);
    });
}

// Make logout globally available
window.logout = logout;

// --- LOAD COURTS ---
window.loadCourts = async function() {
    console.log('Loading courts...');
    
    try {
        const courtsQuery = query(collection(db, "courts"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(courtsQuery);
        
        courts = [];
        querySnapshot.forEach((doc) => {
            const court = doc.data();
            court.id = doc.id;
            courts.push(court);
        });
        
        displayCourts(courts);
        updateStats();
        
    } catch (error) {
        console.error('Error loading courts:', error);
        showError('Error loading courts');
        document.getElementById('courtsList').innerHTML = '<div class="empty-state"><h3>Error Loading Courts</h3><p>Please try refreshing the page.</p></div>';
    }
};

// --- DISPLAY COURTS ---
function displayCourts(courtsToDisplay) {
    const container = document.getElementById('courtsList');
    
    if (courtsToDisplay.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏟️</div>
                <h3>No Courts Found</h3>
                <p>Start by adding your first pickleball court!</p>
            </div>
        `;
        return;
    }
    
    let courtsHTML = '<div class="courts-grid">';
    
    courtsToDisplay.forEach((court) => {
        const courtTypeIcon = court.type === 'indoor' ? '🏢' : court.type === 'outdoor' ? '🌳' : '🏢🌳';
        const createdDate = formatDate(court.createdAt);
        
        courtsHTML += `
            <div class="court-card ${!court.approved ? 'pending-approval' : ''}">
                <div class="court-header">
                    <h3 class="court-name">${court.name}</h3>
                    <span class="court-municipality">${court.municipality}</span>
                    ${!court.approved ? '<span class="approval-badge pending">⏳ Pending Approval</span>' : '<span class="approval-badge approved">✅ Approved</span>'}
                </div>
                
                <div class="court-info">
                    <div class="court-info-item">
                        <span>📍</span>
                        <span>${court.address || 'No address provided'}</span>
                    </div>
                    <div class="court-info-item">
                        <span>${courtTypeIcon}</span>
                        <span>Type: ${court.type || 'outdoor'}</span>
                    </div>
                    <div class="court-info-item">
                        <span>📅</span>
                        <span>Added: ${createdDate}</span>
                    </div>
                    <div class="court-info-item">
                        <span>👤</span>
                        <span>Added by: ${court.addedBy || 'Unknown'}</span>
                    </div>
                </div>
                
                <div class="court-actions">
                    ${!court.approved ? `
                        <button onclick="approveCourt('${court.id}')" class="approve-btn">
                            ✅ Approve
                        </button>
                        <button onclick="rejectCourt('${court.id}')" class="reject-btn">
                            ❌ Reject
                        </button>
                    ` : `
                        <button onclick="deleteCourt('${court.id}')" class="delete-btn">
                            🗑️ Delete
                        </button>
                    `}
                </div>
            </div>
        `;
    });
    
    courtsHTML += '</div>';
    container.innerHTML = courtsHTML;
}

// Make displayCourts globally available
window.displayCourts = displayCourts;

// --- APPROVE COURT ---
window.approveCourt = async function(event, courtId) {
    const approveButton = event.target;
    const originalText = approveButton.textContent;
    
    // Set loading state
    approveButton.disabled = true;
    approveButton.innerHTML = '<span class="spinner"></span> Approving...';
    
    try {
        const courtRef = doc(db, "courts", courtId);
        await updateDoc(courtRef, {
            approved: true,
            approvedAt: new Date(),
            approvedBy: auth.currentUser.email
        });
        
        console.log('Court approved:', courtId);
        alert('✅ Court approved successfully!');
        loadCourts(); // Refresh list
    } catch (error) {
        console.error('Error approving court:', error);
        alert('Error approving court: ' + error.message);
    } finally {
        // Reset button state
        approveButton.disabled = false;
        approveButton.textContent = originalText;
    }
};

// --- REJECT COURT ---
window.rejectCourt = async function(event, courtId) {
    const rejectButton = event.target;
    const originalText = rejectButton.textContent;
    
    const reason = prompt('Please enter a reason for rejection (optional):');
    if (reason === null) {
        return; // User cancelled
    }
    
    // Set loading state
    rejectButton.disabled = true;
    rejectButton.innerHTML = '<span class="spinner"></span> Rejecting...';
    
    try {
        const courtRef = doc(db, "courts", courtId);
        
        const updateData = {
            approved: false,
            rejectedAt: new Date(),
            rejectedBy: auth.currentUser.email
        };
        
        if (reason) {
            updateData.rejectionReason = reason;
        }
        
        await updateDoc(courtRef, updateData);
        
        console.log('Court rejected:', courtId, reason);
        alert('❌ Court rejected successfully!');
        loadCourts(); // Refresh list
    } catch (error) {
        console.error('Error rejecting court:', error);
        alert('Error rejecting court: ' + error.message);
    } finally {
        // Reset button state
        rejectButton.disabled = false;
        rejectButton.textContent = originalText;
    }
};

// --- UPDATE STATS ---
function updateStats() {
    const total = courts.length;
    const municipalities = [...new Set(courts.map(c => c.municipality))].length;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recent = courts.filter(c => c.createdAt && c.createdAt.toDate() >= oneWeekAgo).length;
    
    document.getElementById('totalCourts').textContent = total;
    document.getElementById('totalMunicipalities').textContent = municipalities;
    document.getElementById('recentCourts').textContent = recent;
}

// Make updateStats globally available
window.updateStats = updateStats;

// --- TOGGLE ADD COURT FORM ---
window.toggleAddCourtForm = function() {
    const form = document.getElementById('addCourtForm');
    form.classList.toggle('show');
    
    if (form.classList.contains('show')) {
        document.getElementById('courtForm').reset();
    }
};

// --- SAVE COURT ---
window.saveCourt = async function(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    // Set loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner"></span> Saving...';
    
    try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
            alert('You must be logged in to add a court.');
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            return;
        }
        
        const name = document.getElementById('courtName').value.trim();
        const municipality = document.getElementById('courtMunicipality').value;
        const address = document.getElementById('courtAddress').value.trim();
        const type = document.getElementById('courtType').value;
        
        // Validation
        if (!name || !municipality) {
            alert('Please fill in all required fields.');
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            return;
        }
        
        // Check if user is admin (auto-approve admin courts)
        const userDoc = await getDoc(doc(db, "user_roles", currentUser.uid));
        const isAdmin = userDoc.exists() && userDoc.data().role === 'admin';
        
        const courtData = {
            name: name,
            municipality: municipality,
            address: address || '',
            type: type || 'outdoor', // Keep the actual court type (indoor/outdoor/both)
            createdAt: new Date(),
            addedBy: currentUser.email,
            approved: isAdmin, // Auto-approve if admin, otherwise pending
            submissionType: isAdmin ? 'admin_created' : 'committee_submission' // Use different property name
        };
        
        if (isAdmin) {
            courtData.approvedAt = new Date();
            courtData.approvedBy = currentUser.email;
        }
        
        const docRef = await addDoc(collection(db, "courts"), courtData);
        console.log('Court added:', docRef.id);
        
        const message = isAdmin ? 
            '✅ Court added and approved successfully!' : 
            '✅ Court submitted for approval!';
        
        alert(message);
        
        // Reset form
        document.getElementById('courtForm').reset();
        toggleAddCourtForm();
        
        // Refresh courts list
        loadCourts();
        
    } catch (error) {
        console.error('Error saving court:', error);
        alert('Error saving court: ' + error.message);
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
};

// --- DELETE COURT ---
window.deleteCourt = function(id) {
    const court = courts.find(c => c.id === id);
    if (!court) return;
    
    // Simple confirmation instead of modal
    if (confirm(`Are you sure you want to delete ${court.name}? This action cannot be undone.`)) {
        deleteDoc(doc(db, "courts", id))
            .then(() => {
                showSuccess('Court deleted successfully!');
                loadCourts();
            })
            .catch((error) => {
                console.error('Error deleting court:', error);
                showError('Error deleting court: ' + error.message);
            });
    }
};

// Make deleteCourt globally available
window.deleteCourt = deleteCourt;

// --- FILTER COURTS ---
window.filterCourts = function() {
    const municipalityFilter = document.getElementById('municipalityFilter').value;
    const searchTerm = document.getElementById('searchCourts').value.toLowerCase();
    
    let filtered = courts;
    
    // Filter by municipality
    if (municipalityFilter) {
        filtered = filtered.filter(court => court.municipality === municipalityFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(court => 
            court.name.toLowerCase().includes(searchTerm) ||
            court.address.toLowerCase().includes(searchTerm) ||
            court.municipality.toLowerCase().includes(searchTerm)
        );
    }
    
    displayCourts(filtered);
};

// --- HELPER FUNCTIONS ---
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
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

function showError(message) {
    // Simple error notification
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 600;
    `;
    errorDiv.textContent = '❌ ' + message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 3000);
}

// --- SHOW ADMIN BUTTONS ---
function showAdminButtons() {
    const adminSetupBtn = document.querySelector('button[onclick*="admin-setup.html"]');
    if (adminSetupBtn) {
        adminSetupBtn.style.display = 'inline-block';
    }
}

// --- HIDE ADMIN BUTTONS ---
function hideAdminButtons() {
    const adminSetupBtn = document.querySelector('button[onclick*="admin-setup.html"]');
    if (adminSetupBtn) {
        adminSetupBtn.style.display = 'none';
    }
}

// --- INITIALIZE ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('Court Management page loaded');
    
    // Dropdown functionality
    const dropdownBtn = document.getElementById('managementDropdownBtn');
    const dropdown = document.querySelector('.dropdown');
    
    if (dropdownBtn && dropdown) {
        // Toggle dropdown on button click
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
        
        // Close dropdown when pressing Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dropdown.classList.remove('active');
            }
        });
    }
});
