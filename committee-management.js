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
let currentEditId = null;
let deleteTargetId = null;
let committeeMembers = [];

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
                loadCommitteeMembers();
                
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
        console.log('Admin logged out');
        window.location.href = 'assessment.html';
    }).catch((error) => {
        console.error('Logout error:', error);
    });
}

// Make logout globally available
window.logout = logout;

// --- LOAD COMMITTEE MEMBERS ---
window.loadCommitteeMembers = async function() {
    console.log('Loading committee members...');
    
    try {
        // Load from user_roles collection (where committee members are registered)
        const committeeQuery = query(collection(db, "user_roles"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(committeeQuery);
        
        committeeMembers = [];
        querySnapshot.forEach((doc) => {
            const member = doc.data();
            member.id = doc.id;
            committeeMembers.push(member);
        });
        
        displayCommitteeMembers(committeeMembers);
        updateStats();
        
    } catch (error) {
        console.error('Error loading committee members:', error);
        showError('Error loading committee members');
    }
};

// --- DISPLAY COMMITTEE MEMBERS ---
function displayCommitteeMembers(members) {
    const container = document.getElementById('committeeList');
    const emptyState = document.getElementById('emptyState');
    
    if (members.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    container.innerHTML = members.map(member => {
        // Determine status based on both status and approved fields
        let status = member.status;
        if (!status) {
            if (member.approved === true) {
                status = 'approved';
            } else if (member.approved === false) {
                status = 'pending';
            } else {
                status = 'pending';
            }
        }
        
        const statusColor = getStatusColor(status);
        const statusIcon = getStatusIcon(status);
        const roleIcon = getRoleIcon(member.role);
        
        return `
            <div class="committee-card" style="background: white; border-radius: 12px; padding: 20px; box-shadow: var(--shadow-md); border: 2px solid ${statusColor}; position: relative;">
                <div class="committee-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                    <div>
                        <h3 style="margin: 0; color: var(--text-primary); font-size: 1.2rem; font-weight: 600;">${member.name}</h3>
                        <p style="margin: 5px 0; color: var(--text-secondary); font-size: 0.9rem;">${member.email}</p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                            ${statusIcon} ${status}
                        </span>
                    </div>
                </div>
                
                <div class="committee-info" style="margin-bottom: 15px;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 0.9rem;">
                        <div><strong>${roleIcon} Role:</strong> ${member.role || 'N/A'}</div>
                        <div><strong>📞 Phone:</strong> ${member.phone || 'N/A'}</div>
                        <div style="grid-column: 1 / -1;"><strong>📍 Address:</strong> ${member.address || 'N/A'}</div>
                        <div style="grid-column: 1 / -1;"><strong>📅 Joined:</strong> ${formatDate(member.createdAt)}</div>
                    </div>
                </div>
                
                <div class="committee-actions" style="display: flex; gap: 10px; margin-top: 15px;">
                    ${status === 'approved' ? '' : `
                        <button onclick="approveCommittee('${member.id}')" class="primary" style="flex: 1; padding: 8px 12px; font-size: 0.85rem;">
                            ✅ Approve
                        </button>
                    `}
                    <button onclick="editCommittee('${member.id}')" class="secondary" style="flex: 1; padding: 8px 12px; font-size: 0.85rem;">
                        ✏️ Edit
                    </button>
                    <button onclick="deleteCommittee('${member.id}')" class="committee-btn" style="flex: 1; padding: 8px 12px; font-size: 0.85rem; background: #ff6b6b;">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Make displayCommitteeMembers globally available
window.displayCommitteeMembers = displayCommitteeMembers;

// --- UPDATE STATS ---
function updateStats() {
    const total = committeeMembers.length;
    const active = committeeMembers.filter(m => m.approved === true).length;
    const pending = committeeMembers.filter(m => m.approved === false).length;
    
    document.getElementById('totalCommittee').textContent = total;
    document.getElementById('activeCommittee').textContent = active;
    document.getElementById('pendingCommittee').textContent = pending;
}

// Make updateStats globally available
window.updateStats = updateStats;

// --- FILTER COMMITTEE MEMBERS ---
window.filterCommittee = function() {
    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('searchCommittee').value.toLowerCase();
    
    let filtered = committeeMembers;
    
    // Filter by status
    if (statusFilter !== 'all') {
        filtered = filtered.filter(member => member.status === statusFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(member => 
            member.name.toLowerCase().includes(searchTerm) ||
            member.email.toLowerCase().includes(searchTerm)
        );
    }
    
    displayCommitteeMembers(filtered);
};

// --- SHOW ADD COMMITTEE MODAL ---
function showAddCommitteeModal() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Add Committee Member';
    document.getElementById('committeeForm').reset();
    document.getElementById('committeeModal').classList.add('show');
}

// --- REDIRECT TO ADMIN REGISTRATION ---
function redirectToAdminRegistration() {
    console.log('Redirecting to admin registration page');
    window.location.href = 'committee-registration.html';
}

// Make showAddCommitteeModal globally available
window.showAddCommitteeModal = showAddCommitteeModal;
window.redirectToAdminRegistration = redirectToAdminRegistration;

// --- EDIT COMMITTEE ---
function editCommittee(id) {
    console.log('editCommittee called with id:', id);
    const member = committeeMembers.find(m => m.id === id);
    if (!member) {
        console.log('Member not found for id:', id);
        return;
    }
    
    console.log('Member found:', member);
    currentEditId = id;
    document.getElementById('modalTitle').textContent = 'Edit Committee Member';
    
    // Populate form
    document.getElementById('committeeName').value = member.name || '';
    document.getElementById('committeeEmail').value = member.email || '';
    document.getElementById('committeeRole').value = member.role || '';
    document.getElementById('committeePhone').value = member.phone || '';
    document.getElementById('committeeAddress').value = member.address || '';
    document.getElementById('committeeStatus').value = member.status || 'pending';
    
    console.log('Form populated, showing modal');
    document.getElementById('committeeModal').classList.add('show');
}

// Make editCommittee globally available
window.editCommittee = editCommittee;

// --- SAVE COMMITTEE ---
function saveCommittee(event) {
    event.preventDefault();
    
    const committeeData = {
        name: document.getElementById('committeeName').value.trim(),
        email: document.getElementById('committeeEmail').value.trim(),
        role: document.getElementById('committeeRole').value,
        phone: document.getElementById('committeePhone').value.trim(),
        address: document.getElementById('committeeAddress').value.trim(),
        status: document.getElementById('committeeStatus').value,
        updatedBy: currentUser ? currentUser.email : 'unknown',
        updatedAt: new Date()
    };
    
    if (currentEditId) {
        // Update existing member
        updateDoc(doc(db, "committee", currentEditId), committeeData).then(() => {
            showSuccess('Committee member updated successfully!');
            closeCommitteeModal();
            loadCommitteeMembers();
        }).catch((error) => {
            console.error('Error updating committee member:', error);
            showError('Error updating committee member: ' + error.message);
        });
    } else {
        // Add new member
        committeeData.createdBy = currentUser ? currentUser.email : 'unknown';
        committeeData.createdAt = new Date();
        addDoc(collection(db, "committee"), committeeData).then(() => {
            showSuccess('Committee member added successfully!');
            closeCommitteeModal();
            loadCommitteeMembers();
        }).catch((error) => {
            console.error('Error adding committee member:', error);
            showError('Error adding committee member: ' + error.message);
        });
    }
}

// Make saveCommittee globally available
window.saveCommittee = saveCommittee;

// --- APPROVE COMMITTEE ---
function approveCommittee(id) {
    updateDoc(doc(db, "user_roles", id), {
        approved: true,
        status: 'approved',
        approvedBy: currentUser ? currentUser.email : 'unknown',
        approvedAt: new Date()
    }).then(() => {
        showSuccess('Committee member approved successfully!');
        loadCommitteeMembers();
    }).catch((error) => {
        console.error('Error approving committee member:', error);
        showError('Error approving committee member: ' + error.message);
    });
}

// Make approveCommittee globally available
window.approveCommittee = approveCommittee;

// --- DELETE COMMITTEE ---
function deleteCommittee(id) {
    console.log('deleteCommittee called with id:', id);
    const member = committeeMembers.find(m => m.id === id);
    if (!member) {
        console.log('Member not found for id:', id);
        return;
    }
    
    console.log('Member to delete:', member);
    
    // Simple confirmation instead of modal
    if (confirm(`Are you sure you want to delete ${member.name}? This action cannot be undone.`)) {
        deleteDoc(doc(db, "user_roles", id))
            .then(() => {
                showSuccess('Committee member deleted successfully!');
                loadCommitteeMembers();
            })
            .catch((error) => {
                console.error('Error deleting committee member:', error);
                showError('Error deleting committee member: ' + error.message);
            });
    }
}

// Make deleteCommittee globally available
window.deleteCommittee = deleteCommittee;

// --- REFRESH COMMITTEE LIST ---
function refreshCommitteeList() {
    loadCommitteeMembers();
    showSuccess('Committee list refreshed!');
}

// Make refreshCommitteeList globally available
window.refreshCommitteeList = refreshCommitteeList;

// --- MODAL FUNCTIONS ---
function closeCommitteeModal() {
    document.getElementById('committeeModal').classList.remove('show');
    currentEditId = null;
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('show');
    deleteTargetId = null;
}

// Make modal functions globally available
window.closeCommitteeModal = closeCommitteeModal;
window.closeDeleteModal = closeDeleteModal;

// --- FILTER COMMITTEE MEMBERS ---
function filterCommittee() {
    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('searchCommittee').value.toLowerCase();
    
    let filtered = committeeMembers;
    
    // Filter by status
    if (statusFilter !== 'all') {
        if (statusFilter === 'approved') {
            filtered = filtered.filter(member => member.approved === true);
        } else if (statusFilter === 'pending') {
            filtered = filtered.filter(member => member.approved === false);
        } else if (statusFilter === 'inactive') {
            filtered = filtered.filter(member => member.role === 'inactive');
        }
    }
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(member => 
            member.name.toLowerCase().includes(searchTerm) ||
            member.email.toLowerCase().includes(searchTerm)
        );
    }
    
    displayCommitteeMembers(filtered);
}

// Make filterCommittee globally available
window.filterCommittee = filterCommittee;

// --- HELPER FUNCTIONS ---
function getStatusColor(status) {
    switch(status) {
        case 'approved': return '#4caf50';
        case 'pending': return '#ff9800';
        case 'inactive': return '#f44336';
        default: return '#9e9e9e';
    }
}

function getStatusIcon(status) {
    switch(status) {
        case 'approved': return '✅';
        case 'pending': return '⏳';
        case 'inactive': return '❌';
        default: return '❓';
    }
}

function getRoleIcon(role) {
    switch(role) {
        case 'admin': return '👑';
        case 'assessor': return '📝';
        case 'committee': return '👥';
        default: return '👤';
    }
}

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
    const successDiv = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    successText.textContent = '✅ ' + message;
    successDiv.style.display = 'block';
    
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 3000);
}

function showError(message) {
    alert('❌ ' + message);
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
    console.log('Committee Management page loaded');
    
    // Close modals when clicking outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('show');
        }
    };
});
