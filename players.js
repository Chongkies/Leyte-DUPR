// Import the functions you need from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc, getDoc, addDoc, deleteDoc, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
let isAdmin = false;

// --- MODAL FUNCTIONS ---
window.showAddCourtModal = function() {
    const modal = document.getElementById('addCourtModal');
    modal.classList.add('show');
};

window.closeAddCourtModal = function() {
    const modal = document.getElementById('addCourtModal');
    modal.classList.remove('show');
    document.getElementById('newCourtName').value = '';
    document.getElementById('newCourtMunicipality').value = '';
};

window.closeLoginModal = function() {
    const modal = document.getElementById('loginModal');
    modal.classList.remove('show');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
};

window.performLogin = function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert("Please enter both email and password");
        return;
    }
    
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log('Login successful:', userCredential);
            closeLoginModal();
            alert("Welcome, Committee Member!");
        })
        .catch((error) => {
            console.error('Login failed:', error);
            alert("Login Failed: " + error.message);
        });
};

// --- LOAD COURTS FUNCTION ---
window.loadCourts = async function() {
    console.log('Loading courts from database...');
    
    try {
        const courtsQuery = query(collection(db, "courts"), orderBy("name", "asc"));
        const querySnapshot = await getDocs(courtsQuery);
        
        const courtFilter = document.getElementById('courtFilter');
        if (!courtFilter) return;
        
        // Clear existing options except the first one
        courtFilter.innerHTML = '<option value="All">All Courts</option>';
        
        if (querySnapshot.empty) {
            console.log('No courts found in database');
            return;
        }
        
        // Group courts by municipality
        const courtsByMunicipality = {};
        querySnapshot.forEach((doc) => {
            const court = doc.data();
            const municipality = court.municipality || 'Unknown';
            if (!courtsByMunicipality[municipality]) {
                courtsByMunicipality[municipality] = [];
            }
            courtsByMunicipality[municipality].push(court);
        });
        
        // Create optgroups for each municipality
        Object.keys(courtsByMunicipality).forEach(municipality => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = municipality;
            
            courtsByMunicipality[municipality].forEach(court => {
                const option = document.createElement('option');
                option.value = court.name;
                option.textContent = court.name;
                optgroup.appendChild(option);
            });
            
            courtFilter.appendChild(optgroup);
        });
        
        console.log('Courts loaded successfully');
        
    } catch (error) {
        console.error('Error loading courts:', error);
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
            addedBy: currentUser ? currentUser.email : 'unknown',
            addedAt: new Date()
        });
        
        alert('Court added successfully!');
        closeAddCourtModal();
        
        // Refresh court dropdowns
        loadCourts();
        
    } catch (error) {
        console.error('Error adding court:', error);
        alert('Error adding court: ' + error.message);
    }
};

// --- LOAD PLAYERS LIST FUNCTION ---
window.loadPlayersList = async function() {
    console.log('Loading players list...');
    
    try {
        const playersQuery = query(collection(db, "players"), orderBy("name", "asc"));
        const querySnapshot = await getDocs(playersQuery);
        
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '';
        
        if (querySnapshot.empty) {
            playersList.innerHTML = '<p>No players found in database.</p>';
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const player = doc.data();
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
                        <button onclick="window.location.href='assessment.html?edit=${doc.id}'" class="committee-btn" style="padding: 8px 16px; font-size: 14px;">✏️ Edit</button>
                        <button onclick="deletePlayer('${doc.id}')" class="admin-only" style="padding: 8px 16px; font-size: 14px; background: var(--danger); color: white;">🗑️ Delete</button>
                    </div>
                </div>
            `;
            
            playersList.appendChild(playerCard);
        });
        
    } catch (error) {
        console.error('Error loading players list:', error);
        alert('Error loading players: ' + error.message);
    }
};

// --- DELETE PLAYER FUNCTION ---
window.deletePlayer = function(playerId) {
    if (!confirm('Are you sure you want to delete this player? This action cannot be undone.')) {
        return;
    }
    
    deleteDoc(doc(db, "players", playerId))
        .then(() => {
            alert('Player deleted successfully');
            loadPlayersList(); // Refresh the list
        })
        .catch((error) => {
            console.error('Error deleting player:', error);
            alert('Error deleting player: ' + error.message);
        });
};

// --- LOGOUT FUNCTION ---
window.logout = function() {
    signOut(auth).then(() => {
        alert("Logged Out");
        window.location.href = 'index.html';
    });
};

// --- AUTH STATE LISTENER ---
onAuthStateChanged(auth, async (user) => {
    console.log('Auth state changed - User:', user ? user.email : 'null');
    currentUser = user;
    
    if (user) {
        console.log('User logged in:', user.email);
        document.getElementById('logoutBtn').style.display = 'inline-block';
        
        // Load players and courts when user logs in
        loadPlayersList();
        loadCourts();
        
    } else {
        console.log('User logged out');
        document.getElementById('logoutBtn').style.display = 'none';
        // Show login modal instead of redirecting
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.add('show');
        }
    }
});

// --- DOM READY ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('Players page loaded');
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Add search functionality
    const searchBar = document.getElementById('searchBar');
    const locationFilter = document.getElementById('locationFilter');
    
    if (searchBar) {
        searchBar.addEventListener('input', filterPlayers);
        console.log('Search bar event listener added');
    }
    
    if (locationFilter) {
        locationFilter.addEventListener('change', filterPlayers);
        console.log('Location filter event listener added');
    }
    
    // Load players list if user is authenticated
    if (currentUser) {
        loadPlayersList();
        loadCourts();
    }
});

// --- FILTER PLAYERS FUNCTION ---
window.filterPlayers = function() {
    const searchTerm = document.getElementById('searchBar').value.toLowerCase();
    const locationFilter = document.getElementById('locationFilter').value;
    const playerCards = document.querySelectorAll('.player-card');
    
    console.log('Filtering players:', { searchTerm, locationFilter, totalCards: playerCards.length });
    
    playerCards.forEach((card, index) => {
        const playerName = card.querySelector('h4')?.textContent.toLowerCase() || '';
        const playerInfo = card.querySelectorAll('p');
        const playerLocation = playerInfo[0]?.textContent.toLowerCase() || ''; // First <p> is location
        const playerCourt = playerInfo[1]?.textContent.toLowerCase() || '';   // Second <p> is court
        
        console.log(`Card ${index}:`, { playerName, playerLocation, playerCourt });
        
        // Check if player matches search and location filters
        const matchesSearch = searchTerm === '' || 
                            playerName.includes(searchTerm) || 
                            playerLocation.includes(searchTerm) || 
                            playerCourt.includes(searchTerm);
        
        const matchesLocation = locationFilter === 'All' || 
                              playerLocation.includes(locationFilter.toLowerCase());
        
        // Show/hide card based on filters
        if (matchesSearch && matchesLocation) {
            card.style.display = 'block';
            console.log(`Showing card ${index}`);
        } else {
            card.style.display = 'none';
            console.log(`Hiding card ${index}`);
        }
    });
    
    console.log('Filter applied');
};
