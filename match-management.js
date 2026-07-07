// Import the functions you need from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, where, doc, updateDoc, getDoc, addDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCw2a2hQI9d8yDl5LZQ-0J8a6Lj3YrE",
    authDomain: "leyte-dupr.firebaseapp.com",
    projectId: "leyte-dupr",
    storageBucket: "leyte-dupr.appspot.com",
    messagingSenderId: "9989458808",
    appId: "1:9989458808:web:8d4b6c5f3d2a0d1a0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Global variables
let currentUser = null;
let isAdmin = false;

// --- AUTHENTICATION ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log('User logged in:', user.email);
        checkAdminStatus();
    } else {
        currentUser = null;
        isAdmin = false;
        console.log('No user logged in');
    }
});

// --- CHECK ADMIN STATUS ---
async function checkAdminStatus() {
    if (currentUser) {
        try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            const userData = userDoc.data();
            isAdmin = userData?.role === 'admin' || userData?.role === 'committee';
            
            if (isAdmin) {
                console.log('User has admin/committee privileges');
                loadMatches();
            } else {
                console.log('User does not have admin privileges');
                showAccessDenied();
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
            showAccessDenied();
        }
    } else {
        showAccessDenied();
    }
}

// --- SHOW ACCESS DENIED ---
function showAccessDenied() {
    const container = document.querySelector('.match-management-container');
    if (container) {
        container.innerHTML = `
            <div class="error">
                <h2>Access Denied</h2>
                <p>You need admin or committee privileges to access match management.</p>
                <p>Please contact the system administrator if you believe this is an error.</p>
                <button onclick="window.location.href='index.html'" class="btn btn-secondary">← Back to Home</button>
            </div>
        `;
    }
}

// --- LOAD MATCHES ---
window.loadMatches = async function() {
    console.log('🔄 Loading matches...');
    
    try {
        const playerFilter = document.getElementById('playerFilter').value;
        const tournamentFilter = document.getElementById('tournamentFilter').value;
        const sortBy = document.getElementById('sortBy').value;
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;
        
        // Show loading state
        const container = document.getElementById('matchesList');
        container.innerHTML = '<div class="loading">Loading matches...</div>';
        
        // Build query
        let matchesQuery = query(collection(db, "matches"), orderBy("timestamp", "desc"));
        
        // Apply date filters
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            matchesQuery = query(matchesQuery, where("timestamp", ">=", fromDate));
        }
        
        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999); // End of day
            matchesQuery = query(matchesQuery, where("timestamp", "<=", toDate));
        }
        
        const querySnapshot = await getDocs(matchesQuery);
        let matches = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Apply client-side filters
        if (playerFilter) {
            matches = matches.filter(match => {
                const playerIds = match.playerIds || match.players || [];
                const playerNames = match.players || [];
                return playerIds.includes(playerFilter) || 
                       playerNames.some(p => p && p.name && p.name.includes(playerFilter));
            });
        }
        
        if (tournamentFilter) {
            matches = matches.filter(match => match.tournamentType === tournamentFilter);
        }
        
        // Apply sorting
        if (sortBy === 'player') {
            matches.sort((a, b) => {
                const aPlayers = (a.playerIds || a.players || []).join(', ');
                const bPlayers = (b.playerIds || b.players || []).join(', ');
                return aPlayers.localeCompare(bPlayers);
            });
        } else if (sortBy === 'tournament') {
            matches.sort((a, b) => (a.tournamentName || '').localeCompare(b.tournamentName || ''));
        }
        // timestamp sorting is default (already applied)
        
        displayMatches(matches);
        
    } catch (error) {
        console.error('❌ Error loading matches:', error);
        showError('Error loading matches: ' + error.message);
    }
};

// --- DISPLAY MATCHES ---
window.displayMatches = async function(matches) {
    const container = document.getElementById('matchesList');
    
    if (matches.length === 0) {
        container.innerHTML = '<div class="loading">No matches found</div>';
        return;
    }
    
    // Fetch all player data for name lookup
    const allPlayerDocs = await getDocs(collection(db, "players"));
    const allPlayers = {};
    allPlayerDocs.forEach(doc => {
        allPlayers[doc.id] = { id: doc.id, ...doc.data() };
    });
    
    container.innerHTML = matches.map(match => {
        // Safe date handling
        let date;
        try {
            date = new Date(match.timestamp);
        } catch (error) {
            console.warn('Invalid date format for match:', match.timestamp, error);
            date = new Date();
        }
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        // Get tournament badge class
        const tournamentTypeClass = match.tournamentType === 'major' ? 'badge-major' : 
                                   match.tournamentType === 'minor' ? 'badge-minor' : 'badge-money-game';
        
        const ratingChangeClass = match.ratingChange >= 0 ? 'positive' : 'negative';
        
        // Get player IDs and convert to names
        const playerIds = match.playerIds || match.players || [];
        const players = playerIds.map(playerId => {
            const playerData = allPlayers[playerId];
            return playerData || { id: playerId, name: 'Unknown Player', dynamicRating: 'N/A' };
        });
        
        // Determine winner and loser teams
        const winnerTeam = match.winner === 'A' ? [players[0], players[1]] : [players[2], players[3]];
        const loserTeam = match.winner === 'A' ? [players[2], players[3]] : [players[0], players[1]];
        
        // Safe player name function
        const getPlayerName = (player) => {
            if (!player) return 'Unknown Player';
            if (typeof player === 'string') return player;
            if (player && player.name) return player.name;
            if (player && player.playerName) return player.playerName;
            return 'Unknown Player';
        };
        
        return `
            <div class="match-item">
                <div class="match-header-info">
                    <div>
                        <div class="match-title">${match.tournamentName || 'Match'}</div>
                        <div class="match-meta">
                            <span class="match-date">${formattedDate}</span>
                            <span class="tournament-badge ${tournamentTypeClass}">
                                ${match.tournamentType === 'major' ? 'MAJOR' : 
                                  match.tournamentType === 'minor' ? 'MINOR' : 'MONEY GAME'}
                            </span>
                        </div>
                    </div>
                    <div class="match-details">
                        <div class="detail-group">
                            <div class="detail-label">Winner</div>
                            <div class="detail-value">
                                <div class="players-section">
                                    ${winnerTeam.map(p => `
                                        <span class="player-tag">${getPlayerName(p)}</span>
                                        <span class="rating-info">${p.dynamicRating || p.skillRating || 'N/A'}</span>
                                    `).join(' & ')}
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">Score</div>
                            <div class="detail-value">${match.teamAScore} - ${match.teamBScore}</div>
                        </div>
                        
                        <div class="detail-group">
                            <div class="detail-label">Rating Change</div>
                            <div class="detail-value ${ratingChangeClass}">
                                ${match.ratingChange > 0 ? '+' : ''}${match.ratingChange.toFixed(3)}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="match-actions">
                    <button onclick="deleteMatch('${match.id}')" class="btn btn-danger">🗑️ Delete Match</button>
                    <button onclick="viewMatchDetails('${match.id}')" class="btn btn-primary">📋 View Details</button>
                </div>
            </div>
        `;
    }).join('');
};

// --- DELETE MATCH ---
window.deleteMatch = async function(matchId) {
    if (!confirm('Are you sure you want to delete this match? This will reverse the rating changes and adjust player dynamic ratings accordingly.')) {
        return;
    }
    
    try {
        console.log(`🗑️ Deleting match ${matchId} and adjusting ratings...`);
        
        // Get match details first
        const matchDoc = await getDoc(doc(db, "matches", matchId));
        const match = matchDoc.data();
        
        if (!match) {
            showError('Match not found');
            return;
        }
        
        // Delete the match from global collection
        await deleteDoc(doc(db, "matches", matchId));
        
        // Update each player's match history and dynamic rating
        const playerIds = match.playerIds || match.players || [];
        for (const playerId of playerIds) {
            try {
                // Delete match from player's match history
                const playerMatchHistoryQuery = query(collection(db, "players", playerId, "matchHistory"), where("matchId", "==", matchId));
                const matchHistorySnapshot = await getDocs(playerMatchHistoryQuery);
                
                if (!matchHistorySnapshot.empty) {
                    const matchDoc = matchHistorySnapshot.docs[0];
                    await deleteDoc(matchDoc.ref);
                    console.log(`✓ Deleted match from ${playerId}'s history`);
                }
                
                // Recalculate player's dynamic rating
                await recalculatePlayerDynamicRating(playerId);
                
            } catch (error) {
                console.error(`Error updating player ${playerId}:`, error);
            }
        }
        
        // Refresh matches list
        await loadMatches();
        
        showSuccess('Match deleted and player dynamic ratings adjusted successfully!');
        
    } catch (error) {
        console.error('❌ Error deleting match:', error);
        showError('Error deleting match: ' + error.message);
    }
};

// --- RECALCULATE PLAYER DYNAMIC RATING ---
async function recalculatePlayerDynamicRating(playerId) {
    try {
        console.log(`🔄 Recalculating dynamic rating for player ${playerId}`);
        
        // Get current player data
        const playerDoc = await getDoc(doc(db, "players", playerId));
        const player = playerDoc.data();
        
        if (!player) {
            console.warn(`Player ${playerId} not found`);
            return;
        }
        
        // Get all matches for this player
        const matchHistoryQuery = query(collection(db, "players", playerId, "matchHistory"), orderBy("timestamp", "desc"));
        const matchHistorySnapshot = await getDocs(matchHistoryQuery);
        
        // Calculate total rating change from all matches
        let totalRatingChange = 0;
        matchHistorySnapshot.forEach((matchDoc) => {
            const match = matchDoc.data();
            if (match.ratingChange) {
                totalRatingChange += match.ratingChange;
            }
        });
        
        // Calculate new dynamic rating: skill rating + total match changes
        const newDynamicRating = (player.skillRating || player.skillLevel || 0) + totalRatingChange;
        
        // Update player's dynamic rating
        await updateDoc(doc(db, "players", playerId), {
            dynamicRating: parseFloat(newDynamicRating.toFixed(3)),
            lastUpdated: new Date()
        });
        
        console.log(`✓ Updated ${player.name} dynamic rating: ${player.skillRating || player.skillLevel} + (${totalRatingChange.toFixed(3)}) = ${newDynamicRating.toFixed(3)}`);
        
    } catch (error) {
        console.error(`Error recalculating rating for player ${playerId}:`, error);
    }
}

// --- VIEW MATCH DETAILS ---
window.viewMatchDetails = function(matchId) {
    // Implementation for detailed match view
    console.log(`📋 Viewing details for match ${matchId}`);
    // This could open a modal with full match details
};

// --- CLEAR FILTERS ---
window.clearFilters = function() {
    document.getElementById('playerFilter').value = '';
    document.getElementById('tournamentFilter').value = '';
    document.getElementById('sortBy').value = 'timestamp';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    loadMatches();
};

// --- SHOW SUCCESS ---
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #d4edda;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        font-weight: 600;
    `;
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}

// --- SHOW ERROR ---
function showError(message) {
    const container = document.getElementById('matchesList');
    if (container) {
        container.innerHTML = `<div class="error">${message}</div>`;
    }
}
