// Import functions you need from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, where, doc, updateDoc, getDoc, addDoc, deleteDoc, setDoc, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
let playerAchievements = []; // Store achievements for current player

// --- SKILL CATEGORIZATION HELPER ---
window.getCategory = function(score) {
    if (score >= 5.5) return 'Expert Pro';
    if (score >= 5.0) return 'Expert';
    if (score >= 4.5) return 'Advanced';
    if (score >= 4.0) return 'High Intermediate';
    if (score >= 3.5) return 'Low Intermediate';
    if (score >= 3.0) return 'Advanced Beginner';
    if (score >= 2.5) return 'Beginner';
    if (score >= 1.0) return 'Novice';
    return 'Beginner';
};

// --- MODAL FUNCTIONS ---
window.showAddCourtModal = function() {
    console.log('showAddCourtModal called');
    const modal = document.getElementById('addCourtModal');
    if (modal) {
        modal.classList.add('show');
        console.log('addCourtModal shown');
    } else {
        console.error('addCourtModal not found');
    }
};

window.closeAddCourtModal = function() {
    console.log('closeAddCourtModal called');
    const modal = document.getElementById('addCourtModal');
    if (modal) {
        modal.classList.remove('show');
        document.getElementById('newCourtName').value = '';
        document.getElementById('newCourtMunicipality').value = '';
        console.log('addCourtModal closed');
    }
};

window.showLoginModal = function() {
    console.log('showLoginModal called');
    const modal = document.getElementById('loginModal');
    console.log('loginModal element:', modal);
    
    if (modal) {
        console.log('Adding show class to loginModal');
        modal.classList.add('show');
        console.log('loginModal classes after adding show:', modal.classList.toString());
        console.log('loginModal computed display:', window.getComputedStyle(modal).display);
        console.log('loginModal computed opacity:', window.getComputedStyle(modal).opacity);
        console.log('loginModal computed z-index:', window.getComputedStyle(modal).zIndex);
        console.log('loginModal computed position:', window.getComputedStyle(modal).position);
        console.log('loginModal computed top:', window.getComputedStyle(modal).top);
        console.log('loginModal computed left:', window.getComputedStyle(modal).left);
        console.log('loginModal computed width:', window.getComputedStyle(modal).width);
        console.log('loginModal computed height:', window.getComputedStyle(modal).height);
        console.log('loginModal computed visibility:', window.getComputedStyle(modal).visibility);
        console.log('loginModal shown');
        
        // Force modal to be visible
        modal.style.visibility = 'visible';
        modal.style.pointerEvents = 'auto';
        
        // Check parent elements
        let parent = modal.parentElement;
        while (parent && parent !== document.body) {
            console.log('Parent element:', parent.tagName, 'computed display:', window.getComputedStyle(parent).display, 'computed visibility:', window.getComputedStyle(parent).visibility, 'computed overflow:', window.getComputedStyle(parent).overflow);
            parent = parent.parentElement;
        }
        
        // Check modal content
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            console.log('modal-content found:', modalContent);
            console.log('modal-content computed display:', window.getComputedStyle(modalContent).display);
            console.log('modal-content computed opacity:', window.getComputedStyle(modalContent).opacity);
            console.log('modal-content computed transform:', window.getComputedStyle(modalContent).transform);
            console.log('modal-content computed visibility:', window.getComputedStyle(modalContent).visibility);
            console.log('modal-content computed position:', window.getComputedStyle(modalContent).position);
            console.log('modal-content computed top:', window.getComputedStyle(modalContent).top);
            console.log('modal-content computed left:', window.getComputedStyle(modalContent).left);
            
            // Force modal content to be visible
            modalContent.style.visibility = 'visible';
            modalContent.style.display = 'block';
            modalContent.style.opacity = '1';
            modalContent.style.transform = 'scale(1)';
        } else {
            console.error('modal-content not found');
        }
        
        // Check if modal is actually in the DOM
        console.log('Modal in DOM:', document.body.contains(modal));
        console.log('Modal rect:', modal.getBoundingClientRect());
        
        // Try alternative approach - set styles directly
        modal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: rgba(0, 0, 0, 0.5) !important;
            backdrop-filter: blur(5px) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 9999 !important;
            opacity: 1 !important;
            visibility: visible !important;
        `;
        
        console.log('Applied direct styles to modal');
    } else {
        console.error('loginModal not found');
    }
};

window.closeLoginModal = function() {
    console.log('closeLoginModal called');
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('show');
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        console.log('loginModal closed');
    }
};

window.showRegisterModal = function() {
    console.log('showRegisterModal called');
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.add('show');
        console.log('registerModal shown');
    } else {
        console.error('registerModal not found');
    }
};

window.closeRegisterModal = function() {
    console.log('closeRegisterModal called');
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.remove('show');
    }
};

window.registerCommitteeMember = async function() {
    console.log('registerCommitteeMember called');
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const role = document.getElementById('registerRole').value;
    
    // Validation
    if (!name || !email || !password || !role) {
        alert('Please fill in all fields');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }
    
    try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User created successfully:', userCredential.user.email);
        
        // Add user role to Firestore
        await setDoc(doc(db, "user_roles", userCredential.user.uid), {
            email: email,
            name: name,
            role: role,
            createdAt: new Date(),
            approved: false // Committee members need admin approval
        });
        
        // Close modal and reset form
        closeRegisterModal();
        document.getElementById('registerForm').reset();
        
        alert('Registration successful! Your account is pending approval from an administrator.');
        
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed: ' + error.message);
    }
};

// --- DOM READY ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready');
    loadCourts();
    
    // Add event listeners for doubles match logger preview updates
    const matchInputs = ['teamAPlayer1', 'teamAPlayer2', 'teamBPlayer1', 'teamBPlayer2', 'teamAScore', 'teamBScore', 'doublesTournamentType'];
    matchInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updateDoublesMatchPreview);
            element.addEventListener('input', updateDoublesMatchPreview);
        }
    });
});

// --- ACHIEVEMENT FUNCTIONS ---
window.addAchievement = function() {
    const title = document.getElementById('achievementTitle').value.trim();
    const tournament = document.getElementById('tournamentName').value.trim();
    const type = document.getElementById('tournamentType').value;
    
    if (!title || !tournament) {
        alert("Please fill in both achievement title and tournament name");
        return;
    }
    
    const achievement = {
        id: Date.now().toString(),
        title: title,
        tournament: tournament,
        type: type,
        date: new Date().toISOString()
    };
    
    playerAchievements.push(achievement);
    renderAchievements();
    
    // Clear input fields
    document.getElementById('achievementTitle').value = '';
    document.getElementById('tournamentName').value = '';
    document.getElementById('tournamentType').value = 'minor';
    
    console.log('Achievement added:', achievement);
};

window.removeAchievement = function(id) {
    playerAchievements = playerAchievements.filter(achievement => achievement.id !== id);
    renderAchievements();
    console.log('Achievement removed:', id);
};

window.renderAchievements = function() {
    const container = document.getElementById('achievementsList');
    
    if (playerAchievements.length === 0) {
        container.innerHTML = '<p style="color: #999; font-style: italic;">No achievements added yet</p>';
        return;
    }
    
    // Get achievement emoji mapping
    const getAchievementEmoji = (title) => {
        const emojiMap = {
            'Champion': '🏆',
            '1st Runner Up': '🥈',
            '2nd Runner Up': '🥉',
            '3rd Runner Up': '🥉',
            'Semi-Finalist': '🏅',
            'Quarter-Finalist': '🏅',
        };
        return emojiMap[title] || '🏆';
    };
    
    container.innerHTML = playerAchievements.map(achievement => `
        <div class="achievement-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid ${achievement.type === 'major' ? '#ff6b6b' : '#4ecdc4'};">
            <div style="flex: 1;">
                <strong style="color: var(--primary-green); font-size: 1.1rem;">
                    ${getAchievementEmoji(achievement.title)} ${achievement.title}
                </strong>
                <div style="font-size: 0.9rem; color: #666; margin-top: 4px;">
                    ${achievement.tournament} 
                    <span style="background: ${achievement.type === 'major' ? '#ff6b6b' : '#4ecdc4'}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; margin-left: 8px; font-weight: 600;">
                        ${achievement.type === 'major' ? 'MAJOR' : 'MINOR'}
                    </span>
                </div>
            </div>
            <button onclick="removeAchievement('${achievement.id}')" style="background: #ff4444; color: white; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 0.85rem; font-weight: 500;">✕</button>
        </div>
    `).join('');
};

window.clearAchievements = function() {
    playerAchievements = [];
    renderAchievements();
};

// --- LIVE PREVIEW FUNCTION ---
window.updateLivePreview = function() {
    const selectedRadios = document.querySelectorAll('input[type="radio"]:checked');
    const totalCriteria = 12;
    
    if (selectedRadios.length === 0) {
        document.getElementById('livePreview').innerHTML = '<em>Select ratings to see category preview</em>';
        return;
    }
    
    let totalPoints = 0;
    selectedRadios.forEach(radio => {
        totalPoints += Number(radio.value);
    });
    
    const finalRating = (totalPoints / totalCriteria).toFixed(2);
    const category = window.getCategory(parseFloat(finalRating));
    const categoryClass = `cat-${category.toLowerCase().replace('/', '').replace(' ', '-')}`;
    
    const previewElement = document.getElementById('livePreview');
    previewElement.innerHTML = `
        <div class="live-preview-content">
            <div class="rating-display">
                <span class="current-rating">${finalRating}</span>
                <span class="rating-label">Current Rating</span>
            </div>
            <div class="category-display ${categoryClass}">
                <strong>${category}</strong>
            </div>
        </div>
    `;
};

// --- ADMIN APPROVAL SYSTEM ---
window.approveCommitteeMember = async function(memberId) {
    try {
        await updateDoc(doc(db, "committee", memberId), {
            status: 'approved',
            approvedBy: currentUser ? currentUser.email : 'unknown',
            approvedAt: new Date()
        });
        
        console.log('Committee member approved:', memberId);
        alert('✅ Committee member approved successfully!');
        loadCommitteeMembers(); // Refresh the list
        
    } catch (error) {
        console.error('Error approving committee member:', error);
        alert('❌ Error approving committee member: ' + error.message);
    }
};

// --- LOAD COMMITTEE MEMBERS FOR APPROVAL ---
window.loadCommitteeMembers = async function() {
    console.log('Loading committee members for approval...');
    
    try {
        const committeeQuery = query(collection(db, "committee"), where("status", "==", "pending"));
        const querySnapshot = await getDocs(committeeQuery);
        
        const pendingMembers = [];
        querySnapshot.forEach((doc) => {
            const member = doc.data();
            member.id = doc.id;
            pendingMembers.push(member);
        });
        
        // Display pending members in the admin panel
        displayPendingMembers(pendingMembers);
        
    } catch (error) {
        console.error('Error loading committee members:', error);
    }
};

// --- DISPLAY PENDING MEMBERS ---
window.displayPendingMembers = function(members) {
    // This function can be used to show pending members in the admin panel
    console.log('Pending committee members:', members);
};

// --- LOAD COURTS FUNCTION ---
window.loadCourts = async function() {
    console.log('Loading courts from database...');
    
    try {
        const courtsQuery = query(collection(db, "courts"), orderBy("name", "asc"));
        const querySnapshot = await getDocs(courtsQuery);
        
        const courtSelect = document.getElementById('pCourt');
        if (!courtSelect) return;
        
        // Clear existing options except the first one
        courtSelect.innerHTML = '<option value="" disabled selected>Select Court Location</option>';
        
        if (querySnapshot.empty) {
            console.log('No courts found in database');
            return;
        }
        
        // Group courts by location
        const courtsByLocation = {};
        querySnapshot.forEach((doc) => {
            const courtData = doc.data();
            const location = courtData.municipality || 'Unknown Location'; // Use municipality field
            
            if (!courtsByLocation[location]) {
                courtsByLocation[location] = [];
            }
            courtsByLocation[location].push({
                id: doc.id,
                name: courtData.name,
                location: location
            });
        });
        
        // Add courts grouped by location
        Object.keys(courtsByLocation).sort().forEach(location => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = location;
            
            courtsByLocation[location].forEach(court => {
                const option = document.createElement('option');
                option.value = court.name;
                option.textContent = court.name;
                optgroup.appendChild(option);
            });
            
            courtSelect.appendChild(optgroup);
        });
        
        // Add "Others" option at the end
        const othersOption = document.createElement('option');
        othersOption.value = "OTHERS";
        othersOption.textContent = "🏗️ Register New Court";
        courtSelect.appendChild(othersOption);
        
        console.log('Courts loaded successfully');
    } catch (error) {
        console.error('Error loading courts:', error);
    }
};

// --- COURT SELECTION HANDLER ---
window.handleCourtSelection = function() {
    const courtSelect = document.getElementById('pCourt');
    const newCourtSection = document.getElementById('newCourtSection');
    
    if (courtSelect.value === 'OTHERS') {
        // Show new court registration section
        newCourtSection.style.display = 'block';
        console.log('New court registration section shown');
    } else {
        // Hide new court registration section
        newCourtSection.style.display = 'none';
        console.log('New court registration section hidden');
    }
};

// --- SUBMIT NEW COURT ---
window.submitNewCourt = async function() {
    const submitButton = event.target;
    const originalText = submitButton.textContent;
    
    // Set loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner"></span> Submitting...';
    
    const courtName = document.getElementById('newCourtName').value.trim();
    const courtAddress = document.getElementById('newCourtAddress').value.trim();
    const courtMunicipality = document.getElementById('newCourtMunicipality').value;
    const courtType = document.getElementById('newCourtType').value;
    
    // Validation
    if (!courtName || !courtAddress || !courtMunicipality || !courtType) {
        alert('Please fill in all required fields for new court.');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        return;
    }
    
    try {
        // Get current user
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
            alert('You must be logged in to register a new court.');
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            return;
        }
        
        // Add court to database with admin approval required
        const courtData = {
            name: courtName,
            address: courtAddress,
            municipality: courtMunicipality,
            type: courtType,
            approved: false, // Requires admin approval
            addedBy: user.email, // Fix: Use current user's email
            createdAt: new Date(),
            type: 'committee_submission' // Mark as submitted by committee
        };
        
        const docRef = await addDoc(collection(db, "courts"), courtData);
        console.log('New court submitted for approval:', docRef.id);
        
        // Show success message
        alert('✅ Court registration submitted successfully!\n\nYour court "' + courtName + '" has been submitted for admin approval. You will be able to use it once approved by an administrator.');
        
        // Clear form and hide section
        document.getElementById('newCourtName').value = '';
        document.getElementById('newCourtAddress').value = '';
        document.getElementById('newCourtMunicipality').value = '';
        document.getElementById('newCourtType').value = '';
        document.getElementById('newCourtSection').style.display = 'none';
        
        // Reset court selection
        document.getElementById('pCourt').value = '';
        
        // Reload courts to show the new court (though it won't be usable until approved)
        loadCourts();
        
    } catch (error) {
        console.error('Error submitting new court:', error);
        alert('Error submitting court registration: ' + error.message);
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
};

// --- CANCEL NEW COURT ---
window.cancelNewCourt = function() {
    // Hide the new court section
    document.getElementById('newCourtSection').style.display = 'none';
    
    // Reset form fields
    document.getElementById('newCourtName').value = '';
    document.getElementById('newCourtAddress').value = '';
    document.getElementById('newCourtMunicipality').value = '';
    document.getElementById('newCourtType').value = '';
    
    // Reset court selection
    document.getElementById('pCourt').value = '';
    
    console.log('New court registration cancelled');
};

// --- LOAD PLAYER FOR EDITING ---
window.loadPlayerForEdit = async function(playerId) {
    console.log('Loading player for editing:', playerId);
    
    try {
        const playerDoc = await getDoc(doc(db, "players", playerId));
        if (playerDoc.exists()) {
            const player = playerDoc.data();
            
            // Populate form fields
            document.getElementById('pName').value = player.name || '';
            document.getElementById('pAddress').value = player.address || '';
            document.getElementById('pCourt').value = player.primaryCourt || '';
            
            // Check if user is admin - admins can edit all fields, others can only edit skills
            const currentUser = auth.currentUser;
            if (currentUser) {
                const userRoleDoc = await getDoc(doc(db, "user_roles", currentUser.uid));
                if (userRoleDoc.exists()) {
                    const userRole = userRoleDoc.data();
                    const isAdmin = userRole.role === 'admin';
                    
                    if (isAdmin) {
                        // Admins can edit all fields - don't disable anything
                        console.log('Admin user - all fields enabled for editing');
                        
                        // Remove any disabled styling
                        document.getElementById('pName').disabled = false;
                        document.getElementById('pAddress').disabled = false;
                        document.getElementById('pCourt').disabled = false;
                        document.getElementById('pName').style.backgroundColor = '';
                        document.getElementById('pAddress').style.backgroundColor = '';
                        document.getElementById('pCourt').style.backgroundColor = '';
                    } else {
                        // Non-admins - lock player info fields during edit (only allow skill changes)
                        document.getElementById('pName').disabled = true;
                        document.getElementById('pAddress').disabled = true;
                        document.getElementById('pCourt').disabled = true;
                        
                        // Add visual indication that fields are locked
                        document.getElementById('pName').style.backgroundColor = '#f5f5f5';
                        document.getElementById('pAddress').style.backgroundColor = '#f5f5f5';
                        document.getElementById('pCourt').style.backgroundColor = '#f5f5f5';
                    }
                }
            }
            
            // Populate skill ratings with enhanced field mapping
            const radioNames = ['forehand', 'backhand', 'serve', 'volley', 'dink', 'drop', 'lob', 'drive', 'trans', 'strat', 'athletic'];
            console.log('Populating radio buttons for player:', player);
            console.log('Player skill data:', {
                forehand: player.forehand,
                backhand: player.backhand,
                serve: player.serve,
                volley: player.volley,
                dink: player.dink,
                dropshot: player.dropshot,
                drop: player.drop,
                thirdshot: player.thirdshot,
                lob: player.lob,
                drive: player.drive,
                trans: player.trans,
                strat: player.strat,
                strategy: player.strategy,
                netplay: player.netplay,
                athletic: player.athletic,
                // Check skillCategories
                skillCategories: player.skillCategories
            });
            
            radioNames.forEach(radioName => {
                // Handle field name mapping for old vs new data structure
                let skillValue;
                if (radioName === 'strat') {
                    skillValue = player.strategy || player.strat || player.skillCategories?.strategy || player.skillCategories?.strat || 1;
                } else if (radioName === 'drop') {
                    skillValue = player.dropshot || player.drop || player.thirdshot || player.skillCategories?.drop || player.skillCategories?.dropshot || player.skillCategories?.thirdshot || 1;
                } else if (radioName === 'trans') {
                    skillValue = player.volley || player.trans || player.skillCategories?.trans || player.skillCategories?.volley || 1;
                } else {
                    skillValue = player[radioName] || player.skillCategories?.[radioName] || 1;
                }
                
                // Ensure value is between 1-5
                skillValue = Math.max(1, Math.min(5, parseInt(skillValue) || 1));
                
                const radioInput = document.querySelector(`input[name="${radioName}"][value="${skillValue}"]`);
                console.log(`Setting ${radioName} to value ${skillValue}, found radio:`, !!radioInput);
                if (radioInput) {
                    radioInput.checked = true;
                    console.log(`✓ Set ${radioName} radio button to value ${skillValue}`);
                } else {
                    console.warn(`❌ Could not find radio button for ${radioName} with value ${skillValue}`);
                }
            });
            
            // Load achievements
            if (player.achievements && Array.isArray(player.achievements)) {
                playerAchievements = [...player.achievements];
                renderAchievements();
            } else {
                clearAchievements();
            }
            
            // Update form title
            const formTitle = document.querySelector('#adminPanel h2');
            if (formTitle) {
                formTitle.textContent = `Edit Skills Assessment - ${player.name}`;
            }
            
            // Update submit button text
            const submitBtn = document.getElementById('saveBtn');
            if (submitBtn) {
                submitBtn.textContent = 'Update Skills Rating';
            }
            
            // Show the "Update Player Info Only" button
            const updateInfoBtn = document.getElementById('updateInfoBtn');
            if (updateInfoBtn) {
                updateInfoBtn.style.display = 'inline-block';
                console.log('Update Player Info button shown');
            } else {
                console.error('Update Player Info button not found!');
            }
            
        } else {
            alert('Player not found');
        }
    } catch (error) {
        console.error('Error loading player:', error);
        alert('Error loading player: ' + error.message);
    }
};

// --- ADD COURT FUNCTION ---
window.addCourt = async function() {
    const courtName = document.getElementById('newCourtName').value.trim();
    const municipality = document.getElementById('newCourtMunicipality').value.trim();
    
    if (!courtName || !municipality) {
        alert('Please enter both court name and municipality');
        return;
    }
    
    try {
        await addDoc(collection(db, "courts"), {
            name: courtName,
            municipality: municipality,
            addedBy: currentUser.email,
            addedAt: new Date()
        });
        
        alert('Court added successfully!');
        document.getElementById('newCourtName').value = '';
        document.getElementById('newCourtMunicipality').value = '';
        
        // Refresh court dropdowns
        loadCourts();
        
    } catch (error) {
        console.error('Error adding court:', error);
        alert('Error adding court: ' + error.message);
    }
};

// --- LOAD PLAYERS LIST FUNCTION ---
window.loadPlayersList = async function() {
    console.log('Loading players list for editing...');
    
    try {
        // Get current user's municipality
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.error('No user logged in');
            return;
        }
        
        // Get user's role and municipality
        const userRoleDoc = await getDoc(doc(db, "user_roles", currentUser.uid));
        if (!userRoleDoc.exists()) {
            console.error('User role document not found');
            return;
        }
        
        const userRole = userRoleDoc.data();
        const userMunicipality = userRole.municipality;
        const isAdmin = userRole.role === 'admin';
        
        console.log('User municipality:', userMunicipality);
        console.log('Is admin:', isAdmin);
        
        // Query players
        const playersQuery = query(collection(db, "players"), orderBy("name", "asc"));
        const querySnapshot = await getDocs(playersQuery);
        
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '';
        
        if (querySnapshot.empty) {
            playersList.innerHTML = '<p>No players found in database.</p>';
            return;
        }
        
        let playersFound = 0;
        
        querySnapshot.forEach((doc) => {
            const player = doc.data();
            
            // Filter players based on municipality (unless admin)
            if (!isAdmin && userMunicipality) {
                // Extract municipality from player's address
                const playerAddress = (player.address || '').toLowerCase();
                const playerMunicipalityMatch = playerAddress.includes(userMunicipality.toLowerCase()) ||
                                             playerAddress.includes(userMunicipality.replace('-', ' ').toLowerCase());
                
                if (!playerMunicipalityMatch) {
                    return; // Skip this player
                }
            }
            
            playersFound++;
            
            const skillRating = player.skillRating || player.skillLevel || 0;
            const dynamicRating = player.dynamicRating || player.skillLevel || 0;
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            playerCard.style.cssText = `
                background: var(--card-bg);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            `;
            
            playerCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <h4 style="margin: 0; color: var(--text-primary); font-size: 18px; font-weight: 600;">${player.name || 'Unknown Player'}</h4>
                        <p style="margin: 5px 0; color: var(--text-secondary);">📍 ${player.address || 'No location'}</p>
                        <p style="margin: 5px 0; color: var(--text-secondary);">🏓 ${player.primaryCourt || 'No court'}</p>
                        <div style="margin-top: 10px; padding: 8px 12px; background: #f0f8f0; border-radius: 8px; display: inline-block;">
                            <p style="margin: 0; color: var(--accent); font-weight: 600; font-size: 0.9rem;">
                                ⭐ Fixed: ${skillRating.toFixed(3)} | Live: ${dynamicRating.toFixed(3)}
                            </p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="editPlayer('${doc.id}')" class="committee-btn" style="padding: 8px 16px; font-size: 14px;">✏️ Edit</button>
                        <button onclick="deletePlayer('${doc.id}')" class="admin-only" style="padding: 8px 16px; font-size: 14px; background: var(--danger); color: white;">🗑️ Delete</button>
                    </div>
                </div>
            `;
            
            playersList.appendChild(playerCard);
        });
        
        if (playersFound === 0 && !isAdmin) {
            playersList.innerHTML = `<p>No players found in your municipality (${userMunicipality}). Contact an admin if you need access to players from other areas.</p>`;
        } else if (playersFound === 0) {
            playersList.innerHTML = '<p>No players found in database.</p>';
        }
        
        // Show municipality info to non-admin users
        if (!isAdmin && userMunicipality) {
            const municipalityInfo = document.createElement('div');
            municipalityInfo.style.cssText = `
                background: linear-gradient(135deg, rgba(133, 187, 47, 0.1), rgba(133, 187, 47, 0.05));
                border: 2px solid var(--primary-green);
                border-radius: 12px;
                padding: 15px;
                margin-bottom: 20px;
                text-align: center;
            `;
            municipalityInfo.innerHTML = `
                <h3 style="margin: 0; color: var(--primary-green); font-size: 1.1rem;">🏛️ Municipality: ${userMunicipality.charAt(0).toUpperCase() + userMunicipality.slice(1).replace('-', ' ')}</h3>
                <p style="margin: 5px 0; color: var(--text-secondary);">Showing ${playersFound} player(s) from your registered municipality</p>
            `;
            playersList.insertBefore(municipalityInfo, playersList.firstChild);
        }
        
        // Show/hide admin buttons based on role
        updateButtonVisibility();
        
    } catch (error) {
        console.error('Error loading players list:', error);
        alert('Error loading players: ' + error.message);
    }
};

// --- UPDATE PLAYER INFO ONLY FUNCTION ---
window.updatePlayerInfoOnly = async function() {
    console.log('Updating player info only...');
    
    try {
        // Get form data
        const playerName = document.getElementById('pName').value.trim();
        const playerAddress = document.getElementById('pAddress').value;
        const playerCourt = document.getElementById('pCourt').value;
        const editId = document.getElementById('editId').value;
        
        // Validate required fields
        if (!playerName) {
            showError('Player name is required');
            return;
        }
        
        if (!playerAddress) {
            showError('Municipality address is required');
            return;
        }
        
        if (!playerCourt) {
            showError('Court location is required');
            return;
        }
        
        if (!editId) {
            showError('No player selected for editing');
            return;
        }
        
        // Update only player info (no skill ratings)
        const playerRef = doc(db, "players", editId);
        await updateDoc(playerRef, {
            name: playerName,
            address: playerAddress,
            primaryCourt: playerCourt,
            updatedAt: new Date(),
            updatedBy: currentUser.email
        });
        
        console.log('Player info updated successfully');
        
        // Show success message
        alert('✅ Player information updated successfully!\n\nName: ' + playerName + '\nMunicipality: ' + playerAddress + '\nCourt: ' + playerCourt);
        
        // Reset form and refresh player list
        resetForm();
        loadPlayersList();
        
    } catch (error) {
        console.error('Error updating player info:', error);
        alert('Error updating player info: ' + error.message);
    }
};

// --- EDIT PLAYER FUNCTION ---
window.editPlayer = function(playerId) {
    console.log('Editing player:', playerId);
    
    // First ensure courts are loaded
    loadCourts().then(() => {
        // Load player data into form
        return getDoc(doc(db, "players", playerId));
    }).then((docSnapshot) => {
        if (docSnapshot.exists()) {
            const player = docSnapshot.data();
            
            // Populate form fields
            document.getElementById('editId').value = playerId;
            document.getElementById('pName').value = player.name || '';
            
            // Handle municipality dropdown selection
            const addressSelect = document.getElementById('pAddress');
            if (addressSelect) {
                addressSelect.value = ''; // Reset first
                if (player.address) {
                    // Try to find matching option (case-insensitive)
                    const playerAddress = player.address.toLowerCase();
                    const options = addressSelect.options;
                    console.log('Available municipality options:', Array.from(options).map(opt => ({ value: opt.value, text: opt.text })));
                    
                    for (let i = 0; i < options.length; i++) {
                        const optionText = options[i].text.toLowerCase();
                        const optionValue = options[i].value.toLowerCase();
                        if (optionText === playerAddress || optionValue === playerAddress || 
                            optionText.includes(playerAddress) || playerAddress.includes(optionValue)) {
                            addressSelect.value = options[i].value;
                            console.log('Municipality matched:', options[i].value, 'for address:', player.address);
                            break;
                        }
                    }
                    
                    if (!addressSelect.value) {
                        console.log('No municipality match found for:', player.address);
                    }
                }
            } else {
                console.error('Municipality dropdown not found!');
            }
            
            // Handle court dropdown selection
            const courtSelect = document.getElementById('pCourt');
            if (courtSelect) {
                courtSelect.value = ''; // Reset first
                if (player.primaryCourt) {
                    // Try to find matching court
                    const playerCourt = player.primaryCourt.toLowerCase();
                    const options = courtSelect.options;
                    console.log('Available court options:', Array.from(options).map(opt => ({ value: opt.value, text: opt.text })));
                    
                    for (let i = 0; i < options.length; i++) {
                        const optionText = options[i].text.toLowerCase();
                        const optionValue = options[i].value.toLowerCase();
                        if (optionText === playerCourt || optionValue === playerCourt || 
                            optionText.includes(playerCourt) || playerCourt.includes(optionText)) {
                            courtSelect.value = options[i].value;
                            console.log('Court matched:', options[i].value, 'for court:', player.primaryCourt);
                            break;
                        }
                    }
                    
                    if (!courtSelect.value) {
                        console.log('No court match found for:', player.primaryCourt);
                    }
                }
            } else {
                console.error('Court dropdown not found!');
            }
            
            // Populate radio buttons
            const radioNames = ['forehand', 'backhand', 'serve', 'volley', 'dink', 'dropshot', 'lob', 'drive', 'thirdshot', 'netplay', 'athletic', 'strategy'];
            console.log('Populating radio buttons for player:', player);
            console.log('Player skill data:', {
                forehand: player.forehand,
                backhand: player.backhand,
                serve: player.serve,
                volley: player.volley,
                dink: player.dink,
                dropshot: player.dropshot,
                lob: player.lob,
                drive: player.drive,
                thirdshot: player.thirdshot,
                netplay: player.netplay,
                athletic: player.athletic,
                strategy: player.strategy,
                // Also check the old field names
                strat: player.strat,
                drop: player.drop,
                trans: player.trans
            });
            
            radioNames.forEach(radioName => {
                // Handle field name mapping for old vs new data structure
                let skillValue;
                if (radioName === 'strategy') {
                    skillValue = player.strategy || player.strat || 1;
                } else if (radioName === 'dropshot') {
                    skillValue = player.dropshot || player.drop || 1;
                } else if (radioName === 'volley') {
                    skillValue = player.volley || player.trans || 1;
                } else {
                    skillValue = player[radioName] || player.skillCategories?.[radioName] || 1;
                }
                
                // Ensure value is between 1-5
                skillValue = Math.max(1, Math.min(5, parseInt(skillValue) || 1));
                
                const radioInput = document.querySelector(`input[name="${radioName}"][value="${skillValue}"]`);
                console.log(`Setting ${radioName} to value ${skillValue}, found radio:`, !!radioInput);
                if (radioInput) {
                    radioInput.checked = true;
                } else {
                    console.warn(`Radio input not found for ${radioName} with value ${skillValue}`);
                }
            });
            
            // Change button text
            document.getElementById('saveBtn').textContent = 'Update Player';
            
            // Show the "Update Player Info Only" button
            const updateInfoBtn = document.getElementById('updateInfoBtn');
            if (updateInfoBtn) {
                updateInfoBtn.style.display = 'inline-block';
            }
            
            // Scroll to form
            document.getElementById('adminPanel').scrollIntoView({ behavior: 'smooth' });
            
            console.log('Player loaded for editing:', {
                name: player.name,
                address: player.address,
                court: player.primaryCourt,
                selectedAddress: addressSelect?.value,
                selectedCourt: courtSelect?.value
            });
            
        } else {
            alert('Player not found');
        }
    })
    .catch((error) => {
        console.error('Error loading player data:', error);
        document.getElementById('logoutBtn').style.display = 'none';
        document.getElementById('loginRequired').style.display = 'flex';
        document.getElementById('adminPanel').style.display = 'none';
        isAdmin = false;
    });
};

// --- AUTHENTICATION CHECK ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log('User logged in:', user.email);
        
        // Check if user is admin
        checkAdminStatus(user).then((isUserAdmin) => {
            isAdmin = isUserAdmin;
            console.log('Admin status check result:', isUserAdmin, 'for user:', user.email);
            
            if (isUserAdmin) {
                console.log('Admin logged in:', user.email);
                document.getElementById('loginRequired').style.display = 'none';
                document.getElementById('adminPanel').style.display = 'block';
                
                // Show admin-only buttons
                showAdminButtons();
            } else {
                console.log('Committee member logged in:', user.email);
                isAdmin = false;
                document.getElementById('loginRequired').style.display = 'none';
                document.getElementById('adminPanel').style.display = 'block';
                
                // Hide admin-only buttons
                hideAdminButtons();
            }
            
            // Load data after authentication check
            // Players list loading removed - not needed for assessment page
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
        console.log('Checking admin status for:', user.email, 'UID:', user.uid);
        
        // Check admins collection
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            console.log('Found in admins collection:', adminData);
            return adminData.isActive === true;
        }
        
        console.log('Not found in admins collection, checking user_roles...');
        
        // Also check user_roles collection for admin role
        const committeeQuery = query(collection(db, "user_roles"), where("email", "==", user.email), where("role", "==", "admin"));
        const committeeSnapshot = await getDocs(committeeQuery);
        
        if (!committeeSnapshot.empty) {
            console.log('Found in user_roles collection as admin');
            committeeSnapshot.forEach(doc => {
                console.log('User role document:', doc.data());
            });
        } else {
            console.log('Not found in user_roles as admin either');
        }
        
        return !committeeSnapshot.empty;
        
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// --- SHOW ADMIN BUTTONS ---
function showAdminButtons() {
    const adminButtons = document.querySelectorAll('button[onclick*="admin-setup.html"]');
    adminButtons.forEach(button => {
        button.style.display = 'inline-block';
    });
    console.log('Admin buttons shown');
}

// --- HIDE ADMIN BUTTONS ---
function hideAdminButtons() {
    const adminButtons = document.querySelectorAll('button[onclick*="admin-setup.html"]');
    adminButtons.forEach(button => {
        button.style.display = 'none';
    });
    console.log('Admin buttons hidden');
}

// --- SAVE ASSESSMENT FUNCTION ---
window.saveAssessment = async function(event) {
    event.preventDefault();
    
    console.log('Saving assessment...');
    
    try {
        // Get form data
        const playerName = document.getElementById('pName').value.trim();
        const playerAddress = document.getElementById('pAddress').value;
        const playerCourt = document.getElementById('pCourt').value;
        const editId = document.getElementById('editId').value;
        
        // Validate required fields
        if (!playerName) {
            showError('Player name is required');
            return;
        }
        
        if (!playerAddress) {
            showError('Municipality address is required');
            return;
        }
        
        if (!playerCourt) {
            showError('Court location is required');
            return;
        }
        
        // Calculate skill ratings
        const skillCategories = {
            forehand: getAverageRating('forehand'),
            backhand: getAverageRating('backhand'),
            serve: getAverageRating('serve'),
            dink: getAverageRating('dink'),
            drop: getAverageRating('drop'),
            volley: getAverageRating('volley'),
            trans: getAverageRating('trans'),
            strat: getAverageRating('strat')
        };
        
        console.log('Skill categories calculated:', skillCategories);
        
        // Calculate overall skill rating
        const ratings = Object.values(skillCategories);
        const baseRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        
        // Calculate achievement bonus
        const achievementBonus = calculateAchievementBonus(playerAchievements);
        const finalSkillRating = Math.min(5.0, baseRating + achievementBonus); // Cap at 5.0
        
        console.log('Base rating:', baseRating, 'Achievement bonus:', achievementBonus, 'Final rating:', finalSkillRating);
        
        // Prepare player data
        const playerData = {
            name: playerName,
            address: playerAddress,
            primaryCourt: playerCourt,
            skillCategories: skillCategories,
            skillRating: finalSkillRating,
            baseSkillRating: baseRating,
            achievementBonus: achievementBonus,
            achievements: playerAchievements,
            lastUpdated: new Date(),
            updatedBy: currentUser ? currentUser.email : 'unknown'
        };
        
        // Calculate dynamic rating: base + achievement bonus (uncapped for achievements)
        const dynamicRatingWithAchievements = baseRating + achievementBonus; // NO CAP for dynamic rating
        
        // For new players: initialize dynamic rating
        // For existing players: update dynamic rating with both base rating and achievement bonus changes
        if (!editId) {
            playerData.dynamicRating = dynamicRatingWithAchievements; // New player gets uncapped dynamic rating
            console.log('New player dynamic rating:', dynamicRatingWithAchievements);
        } else {
            // For existing players, get current dynamic rating and calculate the difference
            const currentPlayerDoc = await getDoc(doc(db, "players", editId));
            if (currentPlayerDoc.exists()) {
                const currentData = currentPlayerDoc.data();
                const currentSkillRating = currentData.skillRating || currentData.skillLevel || 0;
                const currentDynamicRating = currentData.dynamicRating || currentData.skillLevel || 0;
                const currentAchievements = currentData.achievements || [];
                
                // Calculate old achievement bonus
                const oldAchievementBonus = calculateAchievementBonus(currentAchievements);
                
                // Calculate the difference in base skill rating
                const baseRatingDifference = baseRating - currentSkillRating;
                
                // --- AUTOMATIC MATCH HISTORY RECALCULATION ---
                // Get match history to calculate accurate match delta
                try {
                    const matchHistoryQuery = query(collection(db, "players", editId, "matchHistory"), orderBy("timestamp", "desc"));
                    const matchHistorySnapshot = await getDocs(matchHistoryQuery);
                    
                    let totalMatchDelta = 0;
                    matchHistorySnapshot.forEach((matchDoc) => {
                        const match = matchDoc.data();
                        if (match.ratingChange) {
                            totalMatchDelta += match.ratingChange;
                        }
                    });
                    
                    console.log('🔧 Automatic Match History Recalculation:', {
                        totalMatches: matchHistorySnapshot.size,
                        totalMatchDelta: totalMatchDelta.toFixed(3),
                        currentSkillRating: currentSkillRating.toFixed(3),
                        currentDynamicRating: currentDynamicRating.toFixed(3),
                        newSkillRating: baseRating.toFixed(3),
                        finalSkillRating: finalSkillRating.toFixed(3)
                    });
                    
                    // Use match history delta instead of current adjustment
                    const newDynamicRating = finalSkillRating + totalMatchDelta;
                    const preciseNewDynamicRating = parseFloat(newDynamicRating.toFixed(3));
                    
                    playerData.dynamicRating = preciseNewDynamicRating;
                    
                    console.log('🔧 Dynamic Rating Synchronization (Match History):', {
                        oldSkillRating: currentSkillRating.toFixed(3),
                        currentDynamicRating: currentDynamicRating.toFixed(3),
                        matchDelta: totalMatchDelta.toFixed(3),
                        newSkillRating: finalSkillRating.toFixed(3),
                        newDynamicRating: preciseNewDynamicRating.toFixed(3),
                        calculation: `${finalSkillRating.toFixed(3)} + ${totalMatchDelta.toFixed(3)} = ${preciseNewDynamicRating.toFixed(3)}`,
                        example: `Old: ${currentSkillRating.toFixed(3)} → ${currentDynamicRating.toFixed(3)} | New: ${finalSkillRating.toFixed(3)} → ${preciseNewDynamicRating.toFixed(3)} (based on ${matchHistorySnapshot.size} matches)`
                    });
                    
                } catch (matchError) {
                    console.warn('Could not recalculate from match history, using fallback:', matchError);
                    
                    // Fallback to original calculation if match history fails
                    const currentMatchAdjustment = currentDynamicRating - currentSkillRating;
                    const newDynamicRating = finalSkillRating + currentMatchAdjustment;
                    const preciseNewDynamicRating = parseFloat(newDynamicRating.toFixed(3));
                    
                    playerData.dynamicRating = preciseNewDynamicRating;
                    
                    console.log('🔧 Dynamic Rating Synchronization (Fallback):', {
                        oldSkillRating: currentSkillRating.toFixed(3),
                        currentDynamicRating: currentDynamicRating.toFixed(3),
                        matchDelta: currentMatchAdjustment.toFixed(3),
                        newSkillRating: finalSkillRating.toFixed(3),
                        newDynamicRating: preciseNewDynamicRating.toFixed(3),
                        calculation: `${finalSkillRating.toFixed(3)} + ${currentMatchAdjustment.toFixed(3)} = ${preciseNewDynamicRating.toFixed(3)}`
                    });
                }
                
            } else {
                // Fallback if player not found
                playerData.dynamicRating = dynamicRatingWithAchievements;
            }
        }
        
        let savePromise;
        
        if (editId) {
            // Update existing player - update dynamic rating based on skill rating changes
            savePromise = updateDoc(doc(db, "players", editId), playerData);
            console.log('Updating existing player:', editId, 'with dynamic rating adjustment');
        } else {
            // Add new player
            playerData.createdAt = new Date();
            playerData.createdBy = currentUser ? currentUser.email : 'unknown';
            savePromise = addDoc(collection(db, "players"), playerData);
            console.log('Adding new player:', playerName);
        }
        
        // Execute save operation
        await savePromise;
        
        // Show success message
        showSuccess(editId ? 'Player updated successfully!' : 'Player added successfully!');
        
        // Reset form
        document.getElementById('assessmentForm').reset();
        document.getElementById('editId').value = '';
        playerAchievements = [];
        renderAchievements();
        
        // Reset button text
        document.getElementById('saveBtn').textContent = '💾 Save Assessment';
        
        console.log('Assessment saved successfully');
        
    } catch (error) {
        console.error('Error saving assessment:', error);
        showError('Failed to save assessment: ' + error.message);
    }
};

// --- ACHIEVEMENT BONUS CALCULATION ---
function calculateAchievementBonus(achievements) {
    if (!achievements || achievements.length === 0) {
        return 0;
    }
    
    let totalBonus = 0;
    
    achievements.forEach(achievement => {
        const bonus = getAchievementBonus(achievement.title, achievement.type);
        totalBonus += bonus;
        console.log(`Achievement bonus: ${achievement.title} (${achievement.type}) = +${bonus}`);
    });
    
    // Cap the total bonus at +1.0 to prevent over-inflation
    return Math.min(1.0, totalBonus);
}

function getAchievementBonus(title, tournamentType) {
    const weight = tournamentType === 'major' ? 1.0 : 0.5;
    
    switch (title) {
        case 'Champion':
            return 0.25 * weight;      // +0.25 (major) or +0.125 (minor)
        case '1st Runner Up':
            return 0.20 * weight;     // +0.20 (major) or +0.10 (minor)
        case '2nd Runner Up':
            return 0.15 * weight;      // +0.15 (major) or +0.075 (minor)
        case '3rd Runner Up':
            return 0.10 * weight;     // +0.10 (major) or +0.05 (minor)
        case 'Semi-Finalist':
            return 0.05 * weight;      // +0.05 (major) or +0.025 (minor)
        case 'Quarter-Finalist':
            return 0.025 * weight;     // +0.025 (major) or +0.0125 (minor)
        default:
            return 0;
    }
}

// --- RESET FORM FUNCTION ---
window.resetForm = function() {
    console.log('Resetting form...');
    
    // Reset all form fields
    document.getElementById('assessmentForm').reset();
    
    // Clear edit ID
    document.getElementById('editId').value = '';
    
    // Unlock player info fields
    const nameField = document.getElementById('pName');
    const addressField = document.getElementById('pAddress');
    const courtField = document.getElementById('pCourt');
    
    if (nameField) {
        nameField.disabled = false;
        nameField.style.backgroundColor = '';
    }
    if (addressField) {
        addressField.disabled = false;
        addressField.style.backgroundColor = '';
    }
    if (courtField) {
        courtField.disabled = false;
        courtField.style.backgroundColor = '';
    }
    
    // Clear achievements
    playerAchievements = [];
    renderAchievements();
    
    // Hide the "Update Player Info Only" button
    const updateInfoBtn = document.getElementById('updateInfoBtn');
    if (updateInfoBtn) {
        updateInfoBtn.style.display = 'none';
    }
    
    // Reset button text
    document.getElementById('saveBtn').textContent = '📝 Save Assessment';
    
    // Update form title
    const formTitle = document.querySelector('#adminPanel h2');
    if (formTitle) {
        formTitle.textContent = '🏓 Player Skill Assessment';
    }
    
    console.log('Form reset complete');
};
function getAverageRating(categoryName) {
    const radios = document.querySelectorAll(`input[name="${categoryName}"]:checked`);
    if (radios.length === 0) return 0;
    
    let total = 0;
    radios.forEach(radio => {
        total += parseInt(radio.value);
    });
    
    return total / radios.length;
}

// --- SUCCESS AND ERROR MESSAGE FUNCTIONS ---
function showSuccess(message) {
    // Remove any existing messages
    const existing = document.querySelector('.success-message, .error-message');
    if (existing) {
        existing.remove();
    }
    
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        z-index: 10000;
        font-weight: 600;
        max-width: 300px;
    `;
    successDiv.textContent = '✅ ' + message;
    document.body.appendChild(successDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}

function showError(message) {
    // Remove any existing messages
    const existing = document.querySelector('.success-message, .error-message');
    if (existing) {
        existing.remove();
    }
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
        z-index: 10000;
        font-weight: 600;
        max-width: 300px;
    `;
    errorDiv.textContent = '❌ ' + message;
    document.body.appendChild(errorDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 3000);
}
window.logout = function() {
    signOut(auth).then(() => {
        console.log('User logged out successfully');
        alert("Logged Out Successfully!");
        // Clear form data safely
        try {
            const playerForm = document.getElementById('playerForm');
            if (playerForm) playerForm.reset();
        } catch (error) {
            console.log('Form reset skipped:', error.message);
        }
        // Page will automatically switch to login view due to auth state listener
    }).catch((error) => {
        console.error('Logout error:', error);
        alert("Error logging out: " + error.message);
    });
};

// --- AUTH STATE LISTENER ---
onAuthStateChanged(auth, async (user) => {
    console.log('Auth state changed - User:', user ? user.email : 'null');
    currentUser = user;
    
    // Update button visibility based on auth state
    const adminSetupBtn = document.getElementById('adminSetupBtn');
    const managementDropdown = document.querySelector('.dropdown');
    const homeBtn = document.getElementById('homeBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (user) {
        console.log('User logged in:', user.email);
        
        // Show admin setup and management dropdown, keep home visible
        if (adminSetupBtn) adminSetupBtn.style.display = 'inline-block';
        if (managementDropdown) managementDropdown.style.display = 'inline-block';
        if (homeBtn) homeBtn.style.display = 'inline-block'; // Keep home visible when logged in
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        
        // Hide filter section, show admin panel, hide login required
        const filterSection = document.getElementById('filterSection');
        const loginRequired = document.getElementById('loginRequired');
        const adminPanel = document.getElementById('adminPanel');
        if (filterSection) filterSection.style.display = 'none';
        if (loginRequired) loginRequired.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'block';
        
        // Load courts when user logs in
        loadCourts();
        
        // Load players for match logger
        loadMatchLoggerPlayers();
        
        // Check if we're in edit mode
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        
        if (editId) {
            console.log('Edit mode detected for player:', editId);
            loadPlayerForEdit(editId);
            document.getElementById('editId').value = editId;
        }
        
    } else {
        console.log('User logged out');
        
        // Show home button, hide admin setup and management dropdown
        if (adminSetupBtn) adminSetupBtn.style.display = 'none';
        if (managementDropdown) managementDropdown.style.display = 'none';
        if (homeBtn) homeBtn.style.display = 'inline-block'; // Show home when logged out
        if (logoutBtn) logoutBtn.style.display = 'none';
        
        // Show filter section and login required, hide admin panel
        const filterSection = document.getElementById('filterSection');
        const loginRequired = document.getElementById('loginRequired');
        const adminPanel = document.getElementById('adminPanel');
        if (filterSection) filterSection.style.display = 'block';
        if (loginRequired) loginRequired.style.display = 'flex';
        if (adminPanel) adminPanel.style.display = 'none';
    }
});

// --- DOM READY ---

// Dropdown functionality
document.addEventListener('DOMContentLoaded', () => {
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

// --- MODE SWITCHING FUNCTIONS ---
window.showAssessmentMode = function() {
    document.getElementById('modeSelection').style.display = 'none';
    document.getElementById('assessmentMode').style.display = 'block';
    console.log('Switched to assessment mode');
};

window.showModeSelection = function() {
    document.getElementById('modeSelection').style.display = 'block';
    document.getElementById('assessmentMode').style.display = 'none';
    console.log('Switched to mode selection');
};

// Promote user to admin role
window.promoteToAdmin = async function(uid) {
    if (!currentUser || !isAdmin) {
        alert("Admin access required to promote users");
        return;
    }
    
    try {
        await setDoc(doc(db, "user_roles", uid), {
            role: 'admin',
            promotedBy: currentUser.email,
            promotedAt: new Date()
        }, { merge: true });
        
        alert("User promoted to admin successfully!");
        console.log(`User ${uid} promoted to admin by ${currentUser.email}`);
        
    } catch (error) {
        console.error('Error promoting user to admin:', error);
        alert("Failed to promote user: " + error.message);
    }
};

// Promote user to committee role
window.promoteToCommittee = async function(uid) {
    if (!currentUser || !isAdmin) {
        alert("Admin access required to promote users");
        return;
    }
    
    try {
        await setDoc(doc(db, "user_roles", uid), {
            role: 'committee',
            promotedBy: currentUser.email,
            promotedAt: new Date()
        }, { merge: true });
        
        alert("User promoted to committee successfully!");
        console.log(`User ${uid} promoted to committee by ${currentUser.email}`);
        
    } catch (error) {
        console.error('Error promoting user to committee:', error);
        alert("Failed to promote user: " + error.message);
    }
};

// Remove user role (demote to no access)
window.removeUserRole = async function(uid) {
    if (!currentUser || !isAdmin) {
        alert("Admin access required to remove user roles");
        return;
    }
    
    try {
        await deleteDoc(doc(db, "user_roles", uid));
        alert("User role removed successfully!");
        console.log(`User ${uid} role removed by ${currentUser.email}`);
        
    } catch (error) {
        console.error('Error removing user role:', error);
        alert("Failed to remove user role: " + error.message);
    }
};

// Get user role by UID
window.getUserRole = async function(uid) {
    try {
        const roleDoc = await getDoc(doc(db, "user_roles", uid));
        return roleDoc.data()?.role || null;
    } catch (error) {
        console.error('Error fetching user role:', error);
        return null;
    }
};

// List all users with their roles (admin only)
window.listUsersWithRoles = async function() {
    if (!currentUser || !isAdmin) {
        alert("Admin access required");
        return [];
    }
    
    try {
        const rolesSnapshot = await getDocs(collection(db, "user_roles"));
        const users = [];
        
        rolesSnapshot.forEach(doc => {
            users.push({
                uid: doc.id,
                role: doc.data().role,
                promotedBy: doc.data().promotedBy,
                promotedAt: doc.data().promotedAt?.toDate()
            });
        });
        
        console.log('Users with roles:', users);
        return users;
        
    } catch (error) {
        console.error('Error fetching users:', error);
        alert("Failed to fetch users: " + error.message);
        return [];
    }
};

// Initialize user role on registration
window.initializeUserRole = async function(uid, email, role = 'committee') {
    try {
        await setDoc(doc(db, "user_roles", uid), {
            role: role,
            email: email,
            createdAt: new Date(),
            createdBy: 'system'
        });
        
        console.log(`User ${email} initialized with role: ${role}`);
        
    } catch (error) {
        console.error('Error initializing user role:', error);
    }
};

window.showAdminRegisterModal = function() {
    const modal = document.getElementById('adminRegisterModal');
    modal.classList.add('show');
};

window.closeAdminRegisterModal = function() {
    const modal = document.getElementById('adminRegisterModal');
    modal.classList.remove('show');
    // Clear form
    document.getElementById('adminRegisterName').value = '';
    document.getElementById('adminRegisterEmail').value = '';
    document.getElementById('adminRegisterPassword').value = '';
    document.getElementById('adminRegisterLocation').selectedIndex = 0;
    document.getElementById('adminRegisterCourt').selectedIndex = 0;
};

window.showCourtModal = function() {
    const modal = document.getElementById('courtModal');
    modal.classList.add('show');
};

window.closeCourtModal = function() {
    const modal = document.getElementById('courtModal');
    modal.classList.remove('show');
    // Clear form
    document.getElementById('courtMunicipality').selectedIndex = 0;
    document.getElementById('courtName').value = '';
    document.getElementById('courtAddress').value = '';
};

window.performLogin = function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert("Please enter both email and password");
        return;
    }
    
    console.log('Attempting login for:', email);
    
    signInWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            console.log('Login successful:', userCredential);
            const user = userCredential.user;
            
            // Check if user has role in user_roles collection
            try {
                const roleDoc = await getDoc(doc(db, "user_roles", user.uid));
                const userRoleData = roleDoc.data();
                
                if (!userRoleData) {
                    // If no role, assign based on email
                    const role = email === 'admin@leytepickleball.com' ? 'admin' : 'committee';
                    console.log('No role found, assigning:', role);
                    
                    // Create role document
                    await setDoc(doc(db, "user_roles", user.uid), {
                        role: role,
                        email: email,
                        createdAt: new Date(),
                        approved: true // Auto-approve for manually created roles
                    });
                    
                    console.log('Role assigned successfully');
                } else {
                    // Check if user is approved
                    if (userRoleData.approved === false) {
                        console.log('User not approved yet');
                        await signOut(auth);
                        alert("Your account is pending admin approval. Please contact an administrator.");
                        return;
                    }
                    
                    console.log('User role found:', userRoleData.role);
                }
            } catch (error) {
                console.error('Error checking/assigning role:', error);
            }
            
            closeLoginModal();
            alert("Welcome, Committee Member!");
        })
        .catch((error) => {
            console.error('Login failed:', error);
            alert("Login Failed: " + error.message);
        });
};

window.performAdminRegistration = async function() {
    if (!isAdmin) {
        alert("Admin access required");
        return;
    }
    
    const name = document.getElementById('adminRegisterName').value.trim();
    const email = document.getElementById('adminRegisterEmail').value.trim();
    const password = document.getElementById('adminRegisterPassword').value;
    const location = document.getElementById('adminRegisterLocation').value;
    const court = document.getElementById('adminRegisterCourt').value;
    
    if (!name || !email || !password || !location || !court) {
        alert("Please fill in all fields");
        return;
    }
    
    try {
        // Create user in Firebase Auth first
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User created successfully:', userCredential.user.email);
        
        // Store user info in Firestore users collection
        await setDoc(doc(db, "users", userCredential.user.uid), {
            name: name,
            email: email,
            role: 'committee',
            location: location,
            primaryCourt: court,
            createdAt: new Date(),
            approved: true,
            createdBy: currentUser.email
        });
        
        // Initialize user role in user_roles collection
        await setDoc(doc(db, "user_roles", userCredential.user.uid), {
            role: 'committee',
            email: email,
            createdAt: new Date(),
            createdBy: currentUser.email,
            promotedBy: currentUser.email,
            promotedAt: new Date()
        });
        
        alert("Committee member registered successfully!");
        closeAdminRegisterModal();
        
    } catch (error) {
        console.error('Admin registration failed:', error);
        
        // Handle specific error types
        if (error.code === 'auth/email-already-in-use') {
            alert("Email already exists. User may already be registered.");
        } else if (error.code === 'auth/weak-password') {
            alert("Password is too weak. Please choose a stronger password.");
        } else if (error.code === 'permission-denied') {
            alert("Permission denied. You may not have admin rights to create users.");
        } else {
            alert("Registration Failed: " + error.message);
        }
    }
};

window.addCourt = async function() {
    if (!isAdmin) {
        alert("Admin access required");
        return;
    }
    
    const municipality = document.getElementById('courtMunicipality').value;
    const courtName = document.getElementById('courtName').value.trim();
    const courtAddress = document.getElementById('courtAddress').value.trim();
    
    if (!municipality || !courtName || !courtAddress) {
        alert("Please fill in all fields");
        return;
    }
    
    try {
        // Add court to Firestore
        await addDoc(collection(db, "courts"), {
            name: courtName,
            address: courtAddress,
            municipality: municipality,
            addedBy: currentUser.email,
            createdAt: new Date()
        });
        
        alert("Court added successfully!");
        closeCourtModal();
        
    } catch (error) {
        console.error('Add court failed:', error);
        alert("Failed to add court: " + error.message);
    }
};

// ...

/**
 * Updates player dynamic ratings based on match results
 * @param {string} winnerId - Firestore document ID of the winner
 * @param {string} loserId - Firestore document ID of the loser
 * @param {number} winnerScore - Winner's final score
 * @param {number} loserScore - Loser's final score
 * @param {boolean} isMajor - Whether this is a Major tournament (1.5x weight) or Minor (1.0x)
 * @param {boolean} isChampion - Whether the winner is tournament champion (+0.025 bonus)
 */
window.updateDynamicRating = async function(winnerId, loserId, winnerScore, loserScore, isMajor, isChampion = false) {
    console.log('Updating dynamic ratings for match:', { winnerId, loserId, winnerScore, loserScore, isMajor, isChampion });
    
    try {
        // Calculate weight based on tournament type
        const weight = isMajor ? 1.5 : 1.0;
        
        // Calculate spread: (winnerScore - loserScore) / winnerScore
        const spread = (winnerScore - loserScore) / winnerScore;
        
        // Base rating change
        const baseChange = 0.05 * spread * weight;
        
        // Winner gets positive change plus champion bonus if applicable
        const winnerChange = baseChange + (isChampion ? 0.025 : 0);
        
        // Loser gets negative change
        const loserChange = -baseChange;
        
        console.log('Rating calculations:', { spread: spread.toFixed(3), weight, baseChange: baseChange.toFixed(3), winnerChange: winnerChange.toFixed(3), loserChange: loserChange.toFixed(3) });
        
        // Get current player data
        const winnerRef = doc(db, "players", winnerId);
        const loserRef = doc(db, "players", loserId);
        
        const winnerDoc = await getDoc(winnerRef);
        const loserDoc = await getDoc(loserRef);
        
        if (!winnerDoc.exists() || !loserDoc.exists()) {
            throw new Error('One or both players not found');
        }
        
        const winnerData = winnerDoc.data();
        const loserData = loserDoc.data();
        
        // Calculate new dynamic ratings
        const currentWinnerRating = winnerData.dynamicRating || winnerData.skillLevel || 0;
        const currentLoserRating = loserData.dynamicRating || loserData.skillLevel || 0;
        
        const newWinnerRating = currentWinnerRating + winnerChange;
        const newLoserRating = currentLoserRating + loserChange;
        
        console.log('Rating updates:', {
            winner: { old: currentWinnerRating.toFixed(3), change: winnerChange.toFixed(3), new: newWinnerRating.toFixed(3) },
            loser: { old: currentLoserRating.toFixed(3), change: loserChange.toFixed(3), new: newLoserRating.toFixed(3) }
        });
        
        // Update both players' dynamic ratings
        await updateDoc(winnerRef, {
            dynamicRating: newWinnerRating,
            lastUpdated: new Date()
        });
        
        await updateDoc(loserRef, {
            dynamicRating: newLoserRating,
            lastUpdated: new Date()
        });
        
        // Save match record to match_history sub-collection for both players
        const matchRecord = {
            winnerId: winnerId,
            loserId: loserId,
            winnerName: winnerData.name,
            loserName: loserData.name,
            winnerScore: winnerScore,
            loserScore: loserScore,
            isMajor: isMajor,
            isChampion: isChampion,
            weight: weight,
            spread: spread,
            winnerChange: winnerChange,
            loserChange: loserChange,
            winnerRatingBefore: currentWinnerRating,
            winnerRatingAfter: newWinnerRating,
            loserRatingBefore: currentLoserRating,
            loserRatingAfter: newLoserRating,
            timestamp: new Date(),
            recordedBy: currentUser ? currentUser.email : 'unknown'
        };
        
        // Save to winner's match_history
        await addDoc(collection(db, "players", winnerId, "match_history"), matchRecord);
        
        // Save to loser's match_history
        await addDoc(collection(db, "players", loserId, "match_history"), matchRecord);
        
        console.log('Match recorded and ratings updated successfully');
        
        return {
            success: true,
            winnerChange: winnerChange,
            loserChange: loserChange,
            newWinnerRating: newWinnerRating,
            newLoserRating: newLoserRating
        };
        
    } catch (error) {
        console.error('Error updating dynamic ratings:', error);
        throw error;
    }
};

// --- DOUBLES MATCH LOGGER UI FUNCTIONS ---

/**
 * Load players into the Doubles Match Logger dropdowns
 */
window.loadMatchLoggerPlayers = async function() {
    console.log('🔍 Loading players for doubles match logger...');
    
    try {
        const playersQuery = query(collection(db, "players"), orderBy("name", "asc"));
        const querySnapshot = await getDocs(playersQuery);
        
        console.log(`📊 Found ${querySnapshot.size} players in database`);
        
        const dropdownIds = ['teamAPlayer1', 'teamAPlayer2', 'teamBPlayer1', 'teamBPlayer2'];
        const dropdowns = dropdownIds.map(id => document.getElementById(id));
        
        console.log('🔍 Checking dropdown elements:', dropdownIds);
        dropdowns.forEach((dropdown, index) => {
            console.log(`Dropdown ${dropdownIds[index]}:`, dropdown ? '✅ Found' : '❌ Not found');
        });
        
        if (dropdowns.some(d => !d)) {
            console.log('❌ Some dropdowns not found, skipping load');
            return;
        }
        
        // Store current selections
        const currentSelections = dropdowns.map(d => d.value);
        
        // Clear and populate dropdowns
        dropdowns.forEach((dropdown, index) => {
            dropdown.innerHTML = `<option value="">Select Player ${(index % 2) + 1}</option>`;
        });
        
        if (querySnapshot.empty) {
            console.log('❌ No players found in database');
            return;
        }
        
        // Create player options
        const playerOptions = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const dynamicRating = parseFloat(data.dynamicRating || data.skillRating || data.skillLevel || 0);
            const skillRating = parseFloat(data.skillRating || data.skillLevel || 0);
            
            console.log(`👤 Player: ${data.name}, Dynamic: ${dynamicRating}, Skill: ${skillRating}`);
            
            playerOptions.push({
                id: doc.id,
                name: data.name || 'Unknown',
                skillRating: skillRating.toFixed(3),
                dynamicRating: dynamicRating.toFixed(3)
            });
        });
        
        console.log(`📝 Created ${playerOptions.length} player options`);
        
        // Populate dropdowns
        dropdowns.forEach((dropdown, dropdownIndex) => {
            console.log(`📝 Populating dropdown ${dropdownIndex + 1} with ${playerOptions.length} players`);
            
            playerOptions.forEach((player, playerIndex) => {
                const option = document.createElement('option');
                option.value = player.id;
                option.textContent = `${player.name} (Fixed: ${player.skillRating}, Live: ${player.dynamicRating})`;
                dropdown.appendChild(option);
                
                console.log(`  ➕ Added option ${playerIndex + 1}: ${player.name}`);
            });
            
            console.log(`📊 Dropdown ${dropdownIndex + 1} now has ${dropdown.options.length} options`);
            console.log(`📋 Dropdown ${dropdownIndex + 1} options:`, Array.from(dropdown.options).map(opt => opt.textContent));
        });
        
        // Restore selections
        dropdowns.forEach((dropdown, index) => {
            if (currentSelections[index]) {
                dropdown.value = currentSelections[index];
            }
        });
        
        console.log('✅ Successfully loaded players into match logger dropdowns');
        
        // Additional UI debugging
        dropdowns.forEach((dropdown, index) => {
            const computedStyle = window.getComputedStyle(dropdown);
            const isVisible = computedStyle.display !== 'none' && 
                            computedStyle.visibility !== 'hidden' && 
                            computedStyle.opacity !== '0';
            
            console.log(`👁️ Dropdown ${dropdownIds[index]} visibility:`, {
                display: computedStyle.display,
                visibility: computedStyle.visibility,
                opacity: computedStyle.opacity,
                isVisible: isVisible,
                optionCount: dropdown.options.length,
                selectedIndex: dropdown.selectedIndex
            });
            
            // Temporary visual test - add a red border to see if dropdown is visible
            dropdown.style.border = '2px solid red';
            setTimeout(() => {
                dropdown.style.border = ''; // Remove red border after 2 seconds
            }, 2000);
        });
        
    } catch (error) {
        console.error('❌ Error loading match logger players:', error);
    }
};

/**
 * Validate that no player is selected twice
 */
function validateDoublesPlayerSelection() {
    const teamA1 = document.getElementById('teamAPlayer1').value;
    const teamA2 = document.getElementById('teamAPlayer2').value;
    const teamB1 = document.getElementById('teamBPlayer1').value;
    const teamB2 = document.getElementById('teamBPlayer2').value;
    
    const selectedPlayers = [teamA1, teamA2, teamB1, teamB2].filter(id => id);
    const uniquePlayers = [...new Set(selectedPlayers)];
    
    if (selectedPlayers.length !== uniquePlayers.length) {
        return { valid: false, message: 'The same player cannot be selected twice in a match.' };
    }
    
    return { valid: true };
}

/**
 * Show validation error
 */
function showValidationError(message) {
    const errorDiv = document.getElementById('validationError');
    if (errorDiv) {
        errorDiv.textContent = '⚠️ ' + message;
        errorDiv.style.display = 'block';
    }
}

/**
 * Hide validation error
 */
function hideValidationError() {
    const errorDiv = document.getElementById('validationError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

/**
 * Record a doubles tournament match and update player ratings using batch
 */
window.recordDoublesMatch = async function() {
    hideValidationError();
    
    // Get all player IDs
    const teamAPlayer1Id = document.getElementById('teamAPlayer1').value;
    const teamAPlayer2Id = document.getElementById('teamAPlayer2').value;
    const teamBPlayer1Id = document.getElementById('teamBPlayer1').value;
    const teamBPlayer2Id = document.getElementById('teamBPlayer2').value;
    
    // Get scores and parse as integers
    const teamAScore = parseInt(document.getElementById('teamAScore').value, 10);
    const teamBScore = parseInt(document.getElementById('teamBScore').value, 10);
    
    // Get tournament type
    const isMajor = document.getElementById('doublesTournamentType').value === 'major';
    
    // Validation: All players selected
    if (!teamAPlayer1Id || !teamAPlayer2Id || !teamBPlayer1Id || !teamBPlayer2Id) {
        showValidationError('Please select all 4 players');
        return;
    }
    
    // Validation: No duplicate players (explicit check)
    const allPlayerIds = [teamAPlayer1Id, teamAPlayer2Id, teamBPlayer1Id, teamBPlayer2Id];
    const uniquePlayerIds = [...new Set(allPlayerIds)];
    if (allPlayerIds.length !== uniquePlayerIds.length) {
        showValidationError('The same player cannot be selected twice in a match.');
        console.error('Duplicate player selection detected:', allPlayerIds);
        return;
    }
    
    // Validation: Valid scores
    if (isNaN(teamAScore) || isNaN(teamBScore) || teamAScore < 0 || teamBScore < 0) {
        showValidationError('Please enter valid scores');
        return;
    }
    
    // Validation: Different scores (no ties)
    if (teamAScore === teamBScore) {
        showValidationError('Scores cannot be tied. Please enter different scores.');
        return;
    }
    
    console.log('Starting doubles match recording...');
    console.log('Team A Players:', teamAPlayer1Id, teamAPlayer2Id);
    console.log('Team B Players:', teamBPlayer1Id, teamBPlayer2Id);
    console.log('Scores:', teamAScore, '-', teamBScore);
    console.log('Is Major:', isMajor);
    
    try {
        // Get all player documents
        const playerIds = [teamAPlayer1Id, teamAPlayer2Id, teamBPlayer1Id, teamBPlayer2Id];
        const playerDocs = await Promise.all(
            playerIds.map(id => getDoc(doc(db, "players", id)))
        );
        
        // Check all players exist
        if (playerDocs.some(doc => !doc.exists())) {
            showValidationError('One or more players not found');
            return;
        }
        
        // Parse player data with explicit parseFloat for ratings
        const players = playerDocs.map(doc => {
            const data = doc.data();
            const dynamicRating = parseFloat(data.dynamicRating || data.skillRating || data.skillLevel || 0);
            const skillRating = parseFloat(data.skillRating || data.skillLevel || 0);
            
            console.log(`Player ${data.name}: dynamicRating=${dynamicRating}, skillRating=${skillRating}`);
            
            return {
                id: doc.id,
                name: data.name || 'Unknown',
                dynamicRating: dynamicRating,
                skillRating: skillRating
            };
        });
        
        // Determine winner and loser teams
        const teamAWins = teamAScore > teamBScore;
        const winnerTeam = teamAWins ? [players[0], players[1]] : [players[2], players[3]];
        const loserTeam = teamAWins ? [players[2], players[3]] : [players[0], players[1]];
        const winnerScore = teamAWins ? teamAScore : teamBScore;
        const loserScore = teamAWins ? teamBScore : teamAScore;
        
        // Calculate team average ratings using parseFloat
        const winnerAvgRating = parseFloat(((winnerTeam[0].dynamicRating + winnerTeam[1].dynamicRating) / 2).toFixed(3));
        const loserAvgRating = parseFloat(((loserTeam[0].dynamicRating + loserTeam[1].dynamicRating) / 2).toFixed(3));
        
        // Calculate spread and rating change
        // Base value: 0.050, Spread formula, Tournament Weight
        const weight = isMajor ? 1.5 : 1.0;
        const spread = parseFloat(((winnerScore - loserScore) / winnerScore).toFixed(3));
        const calculatedChange = parseFloat((0.050 * spread * weight).toFixed(3));
        
        console.log('=== DOUBLES MATCH CALCULATION ===');
        console.log('Winner Team:', winnerTeam.map(p => `${p.name} (${p.dynamicRating})`).join(' & '));
        console.log('Loser Team:', loserTeam.map(p => `${p.name} (${p.dynamicRating})`).join(' & '));
        console.log('Winner Avg Rating:', winnerAvgRating);
        console.log('Loser Avg Rating:', loserAvgRating);
        console.log('Winner Score:', winnerScore);
        console.log('Loser Score:', loserScore);
        console.log('Spread:', spread);
        console.log('Weight:', weight);
        console.log('*** Winner Rating Change: +' + calculatedChange + ' ***');
        console.log('*** Loser Rating Change: -' + calculatedChange + ' ***');
        console.log('=================================');
        
        // Create batch for atomic update
        const batch = writeBatch(db);
        
        // Update winner team players (+calculatedChange)
        winnerTeam.forEach(player => {
            const newRating = parseFloat((player.dynamicRating + calculatedChange).toFixed(3));
            const playerRef = doc(db, "players", player.id);
            
            console.log(`Updating winner ${player.name}: ${player.dynamicRating} -> ${newRating}`);
            
            batch.update(playerRef, {
                dynamicRating: Number(newRating), // Ensure Number type, not String
                lastUpdated: new Date()
            });
        });
        
        // Update loser team players (-calculatedChange)
        loserTeam.forEach(player => {
            const newRating = parseFloat((player.dynamicRating - calculatedChange).toFixed(3));
            const playerRef = doc(db, "players", player.id);
            
            console.log(`Updating loser ${player.name}: ${player.dynamicRating} -> ${newRating}`);
            
            batch.update(playerRef, {
                dynamicRating: Number(newRating), // Ensure Number type, not String
                lastUpdated: new Date()
            });
        });
        
        // Commit batch - CRITICAL: await is essential
        console.log('Committing batch update to Firestore...');
        await batch.commit();
        console.log('✓ Batch commit successful!');
        
        // Create match record for global matches collection
        const matchRecord = {
            type: 'doubles',
            teamA: {
                player1: { id: players[0].id, name: players[0].name },
                player2: { id: players[1].id, name: players[1].name },
                score: teamAScore
            },
            teamB: {
                player1: { id: players[2].id, name: players[2].name },
                player2: { id: players[3].id, name: players[3].name },
                score: teamBScore
            },
            winnerTeam: teamAWins ? 'A' : 'B',
            winnerIds: winnerTeam.map(p => p.id),
            loserIds: loserTeam.map(p => p.id),
            isMajor: isMajor,
            weight: weight,
            spread: spread,
            ratingChange: calculatedChange,
            teamAAvgRating: parseFloat(((players[0].dynamicRating + players[1].dynamicRating) / 2).toFixed(3)),
            teamBAvgRating: parseFloat(((players[2].dynamicRating + players[3].dynamicRating) / 2).toFixed(3)),
            timestamp: new Date(),
            recordedBy: currentUser ? currentUser.email : 'unknown'
        };
        
        // Save to global matches collection
        const globalMatchRef = await addDoc(collection(db, "matches"), matchRecord);
        console.log('✓ Match saved to global collection:', globalMatchRef.id);
        
        // Push match summary to each player's matchHistory sub-collection
        for (let i = 0; i < 4; i++) {
            const player = players[i];
            const isTeamA = i < 2;
            const isWinner = teamAWins === isTeamA;
            const teammate = isTeamA ? players[(i + 1) % 2] : players[2 + ((i - 1) % 2)];
            const opponents = isTeamA ? [players[2], players[3]] : [players[0], players[1]];
            
            const playerMatchRecord = {
                matchId: globalMatchRef.id,
                type: 'doubles',
                teammates: [{ id: teammate.id, name: teammate.name }],
                opponents: opponents.map(o => ({ id: o.id, name: o.name })),
                teamAScore: teamAScore,
                teamBScore: teamBScore,
                isWinner: isWinner,
                ratingChange: isWinner ? calculatedChange : -calculatedChange,
                newDynamicRating: Number(parseFloat((player.dynamicRating + (isWinner ? calculatedChange : -calculatedChange)).toFixed(3))),
                isMajor: isMajor,
                timestamp: new Date()
            };
            
            await addDoc(collection(db, "players", player.id, "matchHistory"), playerMatchRecord);
            console.log(`✓ Match history saved for ${player.name}`);
        }
        
        console.log('✓ Match recorded to all player histories');
        
        // Show success message ONLY after batch.commit() is successful
        const winnerNames = winnerTeam.map(p => p.name).join(' & ');
        const loserNames = loserTeam.map(p => p.name).join(' & ');
        
        alert(`✅ Doubles Match Recorded Successfully!\n\nWinner: ${winnerNames}\nLoser: ${loserNames}\nScore: ${winnerScore} - ${loserScore}\n\nRating Change: ±${calculatedChange.toFixed(3)} points for each player`);
        
        // Clear the form
        clearDoublesMatchForm();
        
        // Refresh player dropdowns to show updated ratings
        loadMatchLoggerPlayers();
        
    } catch (error) {
        console.error('❌ Error recording doubles match:', error);
        console.error('Error stack:', error.stack);
        showValidationError('Error recording match: ' + error.message);
    }
};

/**
 * Clear the doubles match logger form
 */
window.clearDoublesMatchForm = function() {
    document.getElementById('teamAPlayer1').value = '';
    document.getElementById('teamAPlayer2').value = '';
    document.getElementById('teamBPlayer1').value = '';
    document.getElementById('teamBPlayer2').value = '';
    document.getElementById('teamAScore').value = '';
    document.getElementById('teamBScore').value = '';
    document.getElementById('doublesTournamentType').value = 'minor';
    
    // Hide preview and validation error
    const preview = document.getElementById('doublesMatchPreview');
    if (preview) preview.style.display = 'none';
    hideValidationError();
    
    console.log('Doubles match form cleared');
};

/**
 * Update doubles match preview based on current inputs
 */
window.updateDoublesMatchPreview = function() {
    const teamA1 = document.getElementById('teamAPlayer1');
    const teamA2 = document.getElementById('teamAPlayer2');
    const teamB1 = document.getElementById('teamBPlayer1');
    const teamB2 = document.getElementById('teamBPlayer2');
    const teamAScore = parseInt(document.getElementById('teamAScore').value);
    const teamBScore = parseInt(document.getElementById('teamBScore').value);
    const isMajor = document.getElementById('doublesTournamentType').value === 'major';
    
    const preview = document.getElementById('doublesMatchPreview');
    const previewContent = document.getElementById('doublesMatchPreviewContent');
    
    // Hide validation error when preview updates
    hideValidationError();
    
    // Check if all players selected
    if (!teamA1.value || !teamA2.value || !teamB1.value || !teamB2.value) {
        preview.style.display = 'none';
        return;
    }
    
    // Check for duplicate selection
    const duplicateCheck = validateDoublesPlayerSelection();
    if (!duplicateCheck.valid) {
        showValidationError(duplicateCheck.message);
        preview.style.display = 'none';
        return;
    }
    
    // Check scores
    if (isNaN(teamAScore) || isNaN(teamBScore)) {
        preview.style.display = 'none';
        return;
    }
    
    const teamA1Name = teamA1.options[teamA1.selectedIndex].text.split(' (')[0];
    const teamA2Name = teamA2.options[teamA2.selectedIndex].text.split(' (')[0];
    const teamB1Name = teamB1.options[teamB1.selectedIndex].text.split(' (')[0];
    const teamB2Name = teamB2.options[teamB2.selectedIndex].text.split(' (')[0];
    
    const teamAWins = teamAScore > teamBScore;
    const winnerScore = teamAWins ? teamAScore : teamBScore;
    const loserScore = teamAWins ? teamBScore : teamAScore;
    
    const weight = isMajor ? 1.5 : 1.0;
    const spread = (winnerScore - loserScore) / winnerScore;
    const calculatedChange = 0.05 * spread * weight;
    
    const winnerTeam = teamAWins ? `${teamA1Name} & ${teamA2Name}` : `${teamB1Name} & ${teamB2Name}`;
    const loserTeam = teamAWins ? `${teamB1Name} & ${teamB2Name}` : `${teamA1Name} & ${teamA2Name}`;
    
    previewContent.innerHTML = `
        <strong style="color: #2e7d32;">Team A:</strong> ${teamA1Name} & ${teamA2Name}<br>
        <strong style="color: #e65100;">Team B:</strong> ${teamB1Name} & ${teamB2Name}<br>
        <strong>Score:</strong> ${teamAScore} - ${teamBScore}<br>
        <br>
        <strong>Winner:</strong> ${winnerTeam}<br>
        <strong>Spread:</strong> ${spread.toFixed(3)}<br>
        <strong>Weight:</strong> ${weight}x (${isMajor ? 'Major' : 'Minor'})<br>
        <br>
        <span style="color: green; font-weight: 600;">✓ Winning team: +${calculatedChange.toFixed(3)} each</span><br>
        <span style="color: red; font-weight: 600;">✗ Losing team: -${calculatedChange.toFixed(3)} each</span>
    `;
    
    preview.style.display = 'block';
};
