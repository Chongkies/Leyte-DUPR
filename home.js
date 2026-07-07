// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc, getDoc, increment, getDocs, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
let currentFeedbackPlayer = null;
let currentUser = null;

// --- AUTH STATE LISTENER ---
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        console.log('User logged in:', user.email);
        loadPlayers();
        
        // Hide Sign-Up dropdown when logged in
        const signupDropdown = document.getElementById('signupDropdown');
        if (signupDropdown) {
            signupDropdown.style.display = 'none';
        }
    } else {
        console.log('User not logged in - showing public data');
        loadPlayers(); // Still show public data
        
        // Show Sign-Up dropdown when logged out
        const signupDropdown = document.getElementById('signupDropdown');
        if (signupDropdown) {
            signupDropdown.style.display = 'inline-block';
        }
    }
});

// Also try to load players immediately (don't wait for auth)
setTimeout(() => {
    if (!document.querySelector('#playerList').children.length) {
        console.log('Auth not loaded yet, trying to load players anyway...');
        loadPlayers();
    }
}, 1000);

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
    return 'Unrated';
};

// --- ADD ACHIEVEMENT STYLES ---
function addAchievementStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .player-achievements {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(0,0,0,0.1);
        }
        
        .achievements-title {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--text-secondary);
            margin-bottom: 8px;
        }
        
        .achievements-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        
        .achievement-item {
            display: flex;
            align-items: center;
            gap: 4px;
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--text-primary);
            border: 1px solid rgba(0,0,0,0.1);
            transition: all 0.2s ease;
            cursor: default;
        }
        
        .achievement-item:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            background: linear-gradient(135deg, #e9ecef, #dee2e6);
        }
        
        .achievement-icon {
            font-size: 0.8rem;
        }
        
        .achievement-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100px;
        }
        
        @media (max-width: 768px) {
            .achievement-text {
                max-width: 80px;
            }
        }
    `;
    document.head.appendChild(style);
}

// --- ACHIEVEMENT DISPLAY HELPER ---
function formatAchievements(achievements) {
    if (!achievements || !Array.isArray(achievements) || achievements.length === 0) {
        return '';
    }
    
    let achievementHTML = '<div class="player-achievements">';
    achievementHTML += '<div class="achievements-title">🏆 Achievements</div>';
    achievementHTML += '<div class="achievements-list">';
    
    achievements.forEach((achievement, index) => {
        const typeIcon = achievement.type === 'major' ? '👑' : '🏅';
        const title = achievement.title || achievement.achievementTitle || 'Achievement';
        const tournament = achievement.tournament || achievement.tournamentName || 'Tournament';
        
        achievementHTML += `
            <div class="achievement-item" title="${tournament}">
                <span class="achievement-icon">${typeIcon}</span>
                <span class="achievement-text">${title}</span>
            </div>
        `;
    });
    
    achievementHTML += '</div></div>';
    return achievementHTML;
}

// --- LOAD PLAYERS FUNCTION ---
function loadPlayers() {
    console.log('Loading players...');
    
    // Query Definition - Get all players without ordering to handle both field types
    const q = query(collection(db, "players"));

    // --- DISPLAY LOGIC (onSnapshot) ---
    const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log('🔥 Snapshot received:', snapshot.size, 'players');
        console.log('🕐 Snapshot timestamp:', new Date().toISOString());
        
        // Log each player's data for debugging
        snapshot.forEach((doc) => {
            const player = doc.data();
            console.log(`👤 ${player.name}:`, {
                skillRating: player.skillRating,
                dynamicRating: player.dynamicRating,
                skillLevel: player.skillLevel,
                lastUpdated: player.lastUpdated,
                docId: doc.id
            });
        });
        
        const list = document.getElementById('playerList');
        list.innerHTML = '';
        
        // Create skeleton loaders initially
        for (let i = 0; i < 6; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'player-card skeleton';
            skeleton.innerHTML = `
                <div class="skeleton-header">
                    <div class="skeleton-line name"></div>
                </div>
                <div class="skeleton-body">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line rating"></div>
                </div>
            `;
            list.appendChild(skeleton);
        }
        
        // Replace skeletons with actual data
        setTimeout(() => {
            list.innerHTML = '';
            
            if (snapshot.empty) {
                list.innerHTML = '<div class="no-players">No players found in the system.</div>';
                return;
            }
            
            // Convert snapshot to array and sort by skill rating (handle both field names)
            const players = [];
            snapshot.forEach((doc) => {
                const player = doc.data();
                player.id = doc.id;
                const skillRating = player.skillRating || player.skillLevel || 0;
                player.skillRating = skillRating; // Normalize the field name
                players.push(player);
            });
            
            // Sort players by skill rating (highest first)
            players.sort((a, b) => b.skillRating - a.skillRating);
            
            let totalPlayers = 0;
            let totalRating = 0;
            const locations = new Set();
            
            // Process each player
            snapshot.forEach((doc) => {
                const player = doc.data();
                player.id = doc.id;
                
                const skillRating = player.skillRating || player.skillLevel || 0;
                const dynamicRating = player.dynamicRating || player.skillLevel || 0;
                const category = getCategory(dynamicRating); // Use dynamic rating for category
                const categoryClass = `cat-${category.toLowerCase().replace('/', '').replace(' ', '-')}`;
                
                totalPlayers++;
                totalRating += skillRating;
                
                if (player.primaryCourt) {
                    locations.add(player.primaryCourt);
                }
                
                // Create player card
                const card = createPlayerCard(player.id, player);
                list.appendChild(card);
                
                console.log(`📋 Created card for ${player.name}: Fixed=${skillRating.toFixed(3)}, Live=${dynamicRating.toFixed(3)}, Category=${category}`);
            });
            
            // Update stats
            updateStats(totalPlayers, totalRating / totalPlayers, locations.size);
            console.log('Stats updated:', totalPlayers, locations.size);
        }, 500);
    }, (error) => {
        console.error('Error loading players:', error);
        const list = document.getElementById('playerList');
        list.innerHTML = '<div class="error-message">Error loading players. Please try refreshing the page.</div>';
    });
}

// --- MANUAL REFRESH FUNCTION ---
function refreshPlayers() {
    console.log('🔄 Manual refresh triggered');
    const list = document.getElementById('playerList');
    list.innerHTML = '<div class="loading-message">Refreshing player data...</div>';
    
    // Force reload by clearing and reinitializing
    loadPlayers();
}

// --- FORCE REFRESH SPECIFIC PLAYERS ---
window.refreshSpecificPlayers = function(playerName) {
    console.log('🔄 Force refreshing specific player:', playerName);
    
    // Handle both string and array inputs
    const playerNames = Array.isArray(playerName) ? playerName : [playerName];
    
    // Get fresh data for specific players
    playerNames.forEach(async (name) => {
        try {
            const playersQuery = query(collection(db, "players"), where("name", "==", name));
            const querySnapshot = await getDocs(playersQuery);
            
            querySnapshot.forEach((doc) => {
                const player = doc.data();
                console.log(`🔄 Refreshed ${player.name}:`, {
                    skillRating: player.skillRating,
                    dynamicRating: player.dynamicRating,
                    lastUpdated: player.lastUpdated
                });
            });
        } catch (error) {
            console.error(`Error refreshing ${name}:`, error);
        }
    });
    
    // Then refresh the display
    setTimeout(() => {
        refreshPlayers();
    }, 1000);
};

// --- IMMEDIATE REFRESH FOR TESTING ---
window.immediateRefresh = function() {
    console.log('⚡ Immediate refresh - forcing data reload');
    
    // Clear any existing listeners
    const list = document.getElementById('playerList');
    list.innerHTML = '<div class="loading-message">Force refreshing all data...</div>';
    
    // Force complete reload
    setTimeout(() => {
        location.reload();
    }, 500);
};

// --- CHECK SPECIFIC PLAYER DATA ---
window.checkPlayerData = async function(playerName) {
    console.log(`🔍 Checking current data for: ${playerName}`);
    
    try {
        const playersQuery = query(collection(db, "players"), where("name", "==", playerName));
        const querySnapshot = await getDocs(playersQuery);
        
        if (querySnapshot.empty) {
            console.log(`❌ Player ${playerName} not found`);
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const player = doc.data();
            console.log(`📊 Current Firestore data for ${playerName}:`, {
                docId: doc.id,
                name: player.name,
                skillRating: player.skillRating,
                dynamicRating: player.dynamicRating,
                skillLevel: player.skillLevel,
                baseSkillRating: player.baseSkillRating,
                achievementBonus: player.achievementBonus,
                lastUpdated: player.lastUpdated,
                achievements: player.achievements
            });
        });
    } catch (error) {
        console.error(`Error checking ${playerName}:`, error);
    }
};

// --- MANUAL DYNAMIC RATING FIX ---
window.fixDynamicRating = async function(playerName, expectedDynamicRating) {
    console.log(`🔧 Manually fixing dynamic rating for ${playerName} to ${expectedDynamicRating}`);
    
    try {
        // Find the player
        const playersQuery = query(collection(db, "players"), where("name", "==", playerName));
        const querySnapshot = await getDocs(playersQuery);
        
        if (querySnapshot.empty) {
            console.log(`❌ Player ${playerName} not found`);
            return;
        }
        
        // Update the player's dynamic rating
        const playerDoc = querySnapshot.docs[0];
        const playerRef = doc(db, "players", playerDoc.id);
        
        await updateDoc(playerRef, {
            dynamicRating: parseFloat(expectedDynamicRating),
            lastUpdated: new Date()
        });
        
        console.log(`✅ Updated ${playerName} dynamic rating to ${expectedDynamicRating}`);
        
        // Refresh the display
        setTimeout(() => {
            refreshPlayers();
        }, 1000);
        
    } catch (error) {
        console.error(`Error fixing ${playerName}:`, error);
    }
};

// Make it globally available
window.fixDynamicRating = fixDynamicRating;

// --- RECALCULATE DYNAMIC RATING FROM MATCH HISTORY ---
window.recalculateDynamicRatingFromMatchHistory = async function(playerName) {
    console.log(`🔧 Recalculating dynamic rating for ${playerName} based on match history`);
    
    try {
        // Get player data
        const playersQuery = query(collection(db, "players"), where("name", "==", playerName));
        const playerQuerySnapshot = await getDocs(playersQuery);
        
        if (playerQuerySnapshot.empty) {
            console.log(`❌ Player ${playerName} not found`);
            return;
        }
        
        const playerDoc = playerQuerySnapshot.docs[0];
        const player = playerDoc.data();
        const playerRef = doc(db, "players", playerDoc.id);
        
        // Get match history
        const matchHistoryQuery = query(collection(db, "players", playerDoc.id, "matchHistory"), orderBy("timestamp", "desc"));
        const matchHistorySnapshot = await getDocs(matchHistoryQuery);
        
        if (matchHistorySnapshot.empty) {
            console.log(`📝 No match history found for ${playerName}`);
            return;
        }
        
        // Calculate total rating change from match history
        let totalMatchDelta = 0;
        matchHistorySnapshot.forEach((matchDoc) => {
            const match = matchDoc.data();
            if (match.ratingChange) {
                totalMatchDelta += match.ratingChange;
                console.log(`📊 Match: ${match.type}, Rating Change: ${match.ratingChange.toFixed(3)}`);
            }
        });
        
        console.log(`🧮 Match History Calculation for ${playerName}:`, {
            totalMatches: matchHistorySnapshot.size,
            totalMatchDelta: totalMatchDelta.toFixed(3),
            currentSkillRating: player.skillRating.toFixed(3),
            currentDynamicRating: player.dynamicRating.toFixed(3),
            expectedDynamicRating: (player.skillRating + totalMatchDelta).toFixed(3)
        });
        
        // Update with correct dynamic rating
        const correctDynamicRating = player.skillRating + totalMatchDelta;
        await updateDoc(playerRef, {
            dynamicRating: parseFloat(correctDynamicRating.toFixed(3)),
            lastUpdated: new Date()
        });
        
        console.log(`✅ Updated ${playerName} dynamic rating to ${correctDynamicRating.toFixed(3)} based on match history`);
        
        // Refresh display
        setTimeout(() => {
            refreshPlayers();
        }, 1000);
        
    } catch (error) {
        console.error(`Error recalculating for ${playerName}:`, error);
    }
};

// --- TEST ASSESSMENT CALCULATION ---
window.testAssessmentCalculation = async function(playerName) {
    console.log(`🧪 Testing assessment calculation for ${playerName}`);
    
    try {
        // Get player data
        const playersQuery = query(collection(db, "players"), where("name", "==", playerName));
        const playerQuerySnapshot = await getDocs(playersQuery);
        
        if (playerQuerySnapshot.empty) {
            console.log(`❌ Player ${playerName} not found`);
            return;
        }
        
        const playerDoc = playerQuerySnapshot.docs[0];
        const player = playerDoc.data();
        const playerId = playerDoc.id;
        
        // Simulate the assessment calculation
        const currentSkillRating = player.skillRating || player.skillLevel || 0;
        const currentDynamicRating = player.dynamicRating || player.skillLevel || 0;
        
        // Get match history
        const matchHistoryQuery = query(collection(db, "players", playerId, "matchHistory"), orderBy("timestamp", "desc"));
        const matchHistorySnapshot = await getDocs(matchHistoryQuery);
        
        let totalMatchDelta = 0;
        matchHistorySnapshot.forEach((matchDoc) => {
            const match = matchDoc.data();
            if (match.ratingChange) {
                totalMatchDelta += match.ratingChange;
                console.log(`📊 Match: ${match.type}, Rating Change: ${match.ratingChange.toFixed(3)}`);
            }
        });
        
        const newDynamicRating = currentSkillRating + totalMatchDelta;
        
        console.log(`🧪 Test Results for ${playerName}:`, {
            currentSkillRating: currentSkillRating.toFixed(3),
            currentDynamicRating: currentDynamicRating.toFixed(3),
            totalMatchDelta: totalMatchDelta.toFixed(3),
            calculatedDynamicRating: newDynamicRating.toFixed(3),
            needsUpdate: Math.abs(currentDynamicRating - newDynamicRating) > 0.001
        });
        
        if (Math.abs(currentDynamicRating - newDynamicRating) > 0.001) {
            console.log(`🔧 ${playerName} needs dynamic rating update!`);
            console.log(`Run: fixDynamicRating('${playerName}', '${newDynamicRating.toFixed(3)}')`);
        } else {
            console.log(`✅ ${playerName} dynamic rating is correct`);
        }
        
    } catch (error) {
        console.error(`Error testing ${playerName}:`, error);
    }
};

// Make it globally available
window.testAssessmentCalculation = testAssessmentCalculation;

// --- LOAD COURTS FUNCTION ---
window.loadCourts = async function(selectedLocation = 'All') {
    console.log('Loading courts from database...', selectedLocation);
    
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
        
        // Group courts by location and filter if needed
        const courtsByLocation = {};
        querySnapshot.forEach((doc) => {
            const courtData = doc.data();
            // Use municipality field instead of location
            const location = courtData.municipality || 'Unknown Location';
            
            // Debug: Log all court data to see what locations exist
            console.log('Court found:', courtData.name, 'Municipality:', courtData.municipality);
            
            // Skip courts with no valid municipality
            if (!courtData.municipality || courtData.municipality === 'Unknown Location' || courtData.municipality === '') {
                console.log('Skipping court with no valid municipality:', courtData.name);
                return;
            }
            
            // Case-insensitive comparison for location filtering
            const normalizedSelectedLocation = selectedLocation.toLowerCase().trim();
            const normalizedCourtLocation = location.toLowerCase().trim();
            
            // Filter by location if specified (case-insensitive)
            if (selectedLocation !== 'All' && normalizedCourtLocation !== normalizedSelectedLocation) {
                console.log('Skipping court - location mismatch:', courtData.name, 
                           'Expected:', selectedLocation, 'Found:', location);
                return; // Skip courts not in selected location
            }
            
            if (!courtsByLocation[location]) {
                courtsByLocation[location] = [];
            }
            courtsByLocation[location].push({
                id: doc.id,
                name: courtData.name,
                location: location
            });
        });
        
        console.log('Filtered courts by location:', courtsByLocation);
        
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
            
            courtFilter.appendChild(optgroup);
        });
        
        console.log('Courts loaded successfully. Total locations:', Object.keys(courtsByLocation).length);
    } catch (error) {
        console.error('Error loading courts:', error);
    }
};

// --- LOCATION CHANGE HANDLER ---
window.handleLocationChange = function() {
    const locationFilter = document.getElementById('locationFilter');
    const selectedLocation = locationFilter.value;
    
    console.log('Location changed to:', selectedLocation);
    
    // Reload courts based on selected location
    loadCourts(selectedLocation);
    
    // Apply filters
    filterPlayers();
};

// --- PLAYER PROGRESS FUNCTIONS ---
window.getPlayerMatchHistory = async function(playerId) {
    try {
        const playerRef = doc(db, "players", playerId);
        const playerDoc = await getDoc(playerRef);
        
        if (!playerDoc.exists()) {
            console.log('Player not found:', playerId);
            return [];
        }
        
        const player = playerDoc.data();
        return player.ratingHistory || [];
    } catch (error) {
        console.error('Error getting player match history:', error);
        return [];
    }
};

window.calculatePlayerProgress = async function(playerId) {
    const matchHistory = await getPlayerMatchHistory(playerId);
    
    if (matchHistory.length === 0) {
        return {
            currentRating: 0,
            weeklyChange: 0,
            monthlyChange: 0,
            totalMatches: 0,
            winRate: 0,
            currentStreak: 0,
            ratingVelocity: 0
        };
    }
    
    const currentRating = matchHistory[matchHistory.length - 1]?.newRating || 0;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const weeklyMatches = matchHistory.filter(match => 
        new Date(match.timestamp) >= oneWeekAgo
    );
    const monthlyMatches = matchHistory.filter(match => 
        new Date(match.timestamp) >= oneMonthAgo
    );
    
    const wins = matchHistory.filter(match => match.result === 'win').length;
    const currentStreak = calculateCurrentStreak(matchHistory);
    
    const weeklyChange = calculateRatingChange(weeklyMatches);
    const monthlyChange = calculateRatingChange(monthlyMatches);
    const ratingVelocity = calculateRatingVelocity(matchHistory);
    
    return {
        currentRating: currentRating,
        weeklyChange: weeklyChange,
        monthlyChange: monthlyChange,
        totalMatches: matchHistory.length,
        winRate: matchHistory.length > 0 ? (wins / matchHistory.length) * 100 : 0,
        currentStreak: currentStreak,
        ratingVelocity: ratingVelocity
    };
};

function calculateRatingChange(matches) {
    if (matches.length < 2) return 0;
    const firstMatch = matches[0];
    const lastMatch = matches[matches.length - 1];
    return (lastMatch?.newRating || 0) - (firstMatch?.newRating || 0);
}

function calculateCurrentStreak(matchHistory) {
    let currentStreak = 0;
    const sortedHistory = matchHistory.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    for (let i = sortedHistory.length - 1; i >= 0; i--) {
        if (sortedHistory[i].result === 'win') {
            currentStreak++;
        } else {
            break;
        }
    }
    
    return currentStreak;
}

function calculateRatingVelocity(matchHistory) {
    if (matchHistory.length < 2) return 0;
    
    let totalChange = 0;
    for (let i = 1; i < matchHistory.length; i++) {
        totalChange += Math.abs(matchHistory[i].change || 0);
    }
    
    return totalChange / (matchHistory.length - 1);
}

// --- FILTER PLAYERS FUNCTION ---
window.filterPlayers = async function() {
    const searchTerm = document.getElementById('searchBar').value.toLowerCase();
    const locationFilter = document.getElementById('locationFilter').value;
    const courtFilter = document.getElementById('courtFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    const cards = document.querySelectorAll('.player-card');
    
    for (const card of cards) {
        const playerInfo = card.querySelector('.player-info');
        const name = card.querySelector('h3').textContent.toLowerCase();
        const location = card.querySelector('.player-location').textContent.toLowerCase();
        const court = card.querySelector('.player-court').textContent.toLowerCase();
        const category = card.querySelector('.player-category').textContent.toLowerCase();
        
        // Get player ID for progress calculation
        const playerId = card.dataset.playerId;
        
        // Show/hide based on search and filters
        const matchesSearch = !searchTerm || name.includes(searchTerm) || location.includes(searchTerm) || court.includes(searchTerm);
        const matchesLocation = locationFilter === 'All' || location.includes(locationFilter.toLowerCase());
        const matchesCourt = courtFilter === 'All' || court.includes(courtFilter.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || category.includes(categoryFilter.toLowerCase());
        
        const shouldShow = matchesSearch && matchesLocation && matchesCourt && matchesCategory;
        
        card.style.display = shouldShow ? 'block' : 'none';
        
        // Add progress indicator to visible cards
        if (shouldShow && playerId) {
            await addProgressIndicator(card, playerId);
        } else {
            removeProgressIndicator(card);
        }
    }
};

// --- PROGRESS INDICATOR FUNCTIONS ---
window.addProgressIndicator = async function(card, playerId) {
    // Remove existing progress indicator
    removeProgressIndicator(card);
    
    try {
        const progress = await calculatePlayerProgress(playerId);
        
        // Create progress indicator HTML
        const progressHTML = `
            <div class="player-progress">
                <div class="progress-header">
                    <div class="current-rating">
                        <span class="rating-value">${progress.currentRating.toFixed(3)}</span>
                        <div class="rating-change ${progress.weeklyChange >= 0 ? 'positive' : 'negative'}">
                            ${progress.weeklyChange >= 0 ? '↑' : '↓'} ${Math.abs(progress.weeklyChange).toFixed(3)}
                        </div>
                    </div>
                    <div class="progress-stats">
                        <div class="stat">
                            <span class="stat-label">Win Rate:</span>
                            <span class="stat-value">${(progress.winRate * 100).toFixed(1)}%</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Streak:</span>
                            <span class="stat-value">${progress.currentStreak}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Matches:</span>
                            <span class="stat-value">${progress.totalMatches}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert progress indicator after player info
        const playerInfo = card.querySelector('.player-info');
        playerInfo.insertAdjacentHTML('beforeend', progressHTML);
        
    } catch (error) {
        console.error('Error loading player progress:', error);
    }
};

window.removeProgressIndicator = function(card) {
    const progressIndicator = card.querySelector('.player-progress');
    if (progressIndicator) {
        progressIndicator.remove();
    }
};

// --- DOM READY ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('Homepage loaded - setting up event listeners');
    
    // Load courts when page loads
    loadCourts();
    
const searchBar = document.getElementById('searchBar');
const locationFilter = document.getElementById('locationFilter');
const courtFilter = document.getElementById('courtFilter');
const categoryFilter = document.getElementById('categoryFilter');
    
// Search functionality
if (searchBar) {
searchBar.addEventListener('keyup', filterPlayers);
}
    
if (locationFilter) {
locationFilter.addEventListener('change', filterPlayers);
}
    
if (courtFilter) {
courtFilter.addEventListener('change', filterPlayers);
}
    
if (categoryFilter) {
categoryFilter.addEventListener('change', filterPlayers);
}
    
// Load players
loadPlayers();
});

// --- ACHIEVEMENT CONFIGURATION ---
function getAchievementConfig(achievement) {
    if (!achievement || typeof achievement !== 'object') {
        // Handle string-based achievements (backward compatibility)
        const emojiMap = {
            'Champion': { icon: '🏆', color: '#FFD700', description: 'Tournament Champion' },
            '1st Runner Up': { icon: '🥈', color: '#C0C0C0', description: 'First Runner Up' },
            '2nd Runner Up': { icon: '🥉', color: '#CD7F32', description: 'Second Runner Up' },
            'Semi-Finalist': { icon: '⭐', color: '#4ECDC4', description: 'Semi-Finalist' },
            'Quarter-Finalist': { icon: '🌟', color: '#45B7D1', description: 'Quarter-Finalist' }
        };
        return emojiMap[achievement] || { icon: '🏆', color: '#6C757D', description: achievement };
    }
    
    // Handle object-based achievements
    const emojiMap = {
        'Champion': { icon: '🏆', color: '#FFD700', description: `Champion - ${achievement.tournament || 'Tournament'}` },
        '1st Runner Up': { icon: '🥈', color: '#C0C0C0', description: `1st Runner Up - ${achievement.tournament || 'Tournament'}` },
        '2nd Runner Up': { icon: '🥉', color: '#CD7F32', description: `2nd Runner Up - ${achievement.tournament || 'Tournament'}` },
        'Semi-Finalist': { icon: '⭐', color: '#4ECDC4', description: `Semi-Finalist - ${achievement.tournament || 'Tournament'}` },
        'Quarter-Finalist': { icon: '🌟', color: '#45B7D1', description: `Quarter-Finalist - ${achievement.tournament || 'Tournament'}` }
    };
    
    const config = emojiMap[achievement.title] || { icon: '🏆', color: '#6C757D', description: achievement.title || 'Achievement' };
    
    // Adjust color based on tournament type
    if (achievement.type === 'major') {
        config.color = '#FF6B6B'; // Red for major tournaments
    } else if (achievement.type === 'minor') {
        config.color = '#4ECDC4'; // Teal for minor tournaments
    }
    
    return config;
}

// --- HELPER FUNCTIONS ---
function createPlayerCard(id, player) {
    const skillRating = player.skillRating || player.skillLevel || 0;
    const dynamicRating = player.dynamicRating || player.skillLevel || 0;
    const category = getCategory(dynamicRating); // Use dynamic rating for category
    const categoryClass = `cat-${category.toLowerCase().replace('/', '').replace(' ', '-')}`;
    
    const card = document.createElement('div');
    card.className = 'player-card';
    card.dataset.playerId = id; // Add player ID for click handling
    card.style.cursor = 'pointer'; // Add cursor pointer to indicate clickable
    card.innerHTML = `
        <div class="player-header">
            <h3>${player.name || 'Unknown Player'}</h3>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                <span class="skill-rating" title="Fixed Skill Rating">${skillRating.toFixed(3)}</span>
                <span class="dynamic-rating" style="font-size: 0.85rem; color: var(--accent); font-weight: 500;" title="Dynamic Rating">Live: ${dynamicRating.toFixed(3)}</span>
            </div>
        </div>
        <div class="player-info">
            <p>📍 ${player.address || 'No location'}</p>
            <p>🏓 ${player.primaryCourt || 'No court'}</p>
            <div class="skill-category ${categoryClass}">
                <strong>${category}</strong>
            </div>
            ${formatAchievements(player.achievements)}
        </div>
    `;
    
    // Add click event listener
    card.addEventListener('click', function(e) {
        e.stopPropagation();
        console.log(`🖱️ Clicked player: ${player.name} (ID: ${id})`);
        window.location.href = `player-profile.html?id=${id}`;
    });
    
    return card;
}

function updateStats(totalPlayers, avgRating, locations) {
    document.getElementById('totalPlayers').textContent = totalPlayers;
    document.getElementById('avgRating').textContent = avgRating.toFixed(3);
    document.getElementById('activeLocations').textContent = locations;
}

function filterPlayers() {
    const searchTerm = document.getElementById('searchBar').value.toLowerCase();
    const locationFilter = document.getElementById('locationFilter').value;
    const courtFilter = document.getElementById('courtFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    const cards = document.querySelectorAll('.player-card');
    
    cards.forEach(card => {
        const name = card.querySelector('h3').textContent.toLowerCase();
        const playerInfo = card.querySelector('.player-info');
        
        if (!playerInfo) {
            card.style.display = 'none';
            return;
        }
        
        const location = playerInfo.querySelector('p').textContent.toLowerCase();
        const court = playerInfo.querySelectorAll('p')[1].textContent.toLowerCase();
        const category = playerInfo.querySelector('.skill-category strong').textContent;
        
        // Check if card matches all filters
        const matchesSearch = !searchTerm || name.includes(searchTerm) || location.includes(searchTerm) || court.includes(searchTerm);
        const matchesLocation = locationFilter === 'All' || location.includes(locationFilter.toLowerCase());
        const matchesCourt = courtFilter === 'All' || court.includes(courtFilter.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || category === categoryFilter;
        
        card.style.display = matchesSearch && matchesLocation && matchesCourt && matchesCategory ? 'block' : 'none';
    });
}

// --- FEEDBACK FUNCTIONS ---
function getRatingLevel(skillLevel) {
    if (skillLevel >= 4.5) return 'Professional';
    if (skillLevel >= 3.5) return 'Advanced';
    if (skillLevel >= 2.5) return 'Intermediate';
    if (skillLevel >= 1.5) return 'Beginner+';
    return 'Beginner';
}

function openFeedbackModal(playerId, playerName, rating) {
    currentFeedbackPlayer = { id: playerId, name: playerName, rating: rating };
    document.getElementById('feedbackPlayerName').textContent = playerName;
    document.getElementById('feedbackRating').textContent = rating.toFixed(2);
    document.getElementById('feedbackLevel').textContent = getRatingLevel(rating);
    document.getElementById('feedbackModal').classList.add('show');
}

function closeFeedbackModal() {
    document.getElementById('feedbackModal').classList.remove('show');
    currentFeedbackPlayer = null;
}

function submitFeedback(type) {
    if (!currentFeedbackPlayer) return;
    
    const playerRef = doc(db, "players", currentFeedbackPlayer.id);
    updateDoc(playerRef, {
        [`feedback.${type}`]: increment(1)
    }).then(() => {
        closeFeedbackModal();
        alert('Feedback submitted successfully!');
    }).catch(error => {
        console.error('Error submitting feedback:', error);
        alert('Error submitting feedback');
    });
}

// --- GLOBAL FUNCTIONS ---
window.openFeedbackModal = function(playerId, playerName, rating) {
    currentFeedbackPlayer = { id: playerId, name: playerName, rating: rating };
    
    // Update modal content
    document.getElementById('feedbackPlayerName').textContent = playerName;
    document.getElementById('feedbackRating').textContent = rating.toFixed(2);
    document.getElementById('feedbackLevel').textContent = getRatingLevel(rating);
    
    // Show modal
    document.getElementById('feedbackModal').classList.add('show');
};

window.closeFeedbackModal = function() {
    document.getElementById('feedbackModal').classList.remove('show');
    currentFeedbackPlayer = null;
};

window.submitFeedback = function(type) {
    if (!currentFeedbackPlayer) return;
    
    const playerRef = doc(db, "players", currentFeedbackPlayer.id);
    updateDoc(playerRef, {
        [`feedback.${type}`]: increment(1)
    }).then(() => {
        closeFeedbackModal();
        alert('Feedback submitted successfully!');
    }).catch(error => {
        console.error('Error submitting feedback:', error);
        alert('Error submitting feedback');
    });
};

window.filterPlayers = function() {
    const search = document.getElementById('searchBar').value.toLowerCase();
    const locationFilter = document.getElementById('locationFilter').value;
    const courtFilter = document.getElementById('courtFilter').value;
    const cards = document.getElementsByClassName('player-card');

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const textContent = card.innerText.toLowerCase();
        
        const matchesSearch = textContent.includes(search);
        
        let matchesLocation = true;
        if (locationFilter !== "All") {
            if (!textContent.includes(locationFilter.toLowerCase())) {
                matchesLocation = false;
            }
        }
        
        let matchesCourt = true;
        if (courtFilter !== "All") {
            if (!textContent.includes(courtFilter.toLowerCase())) {
                matchesCourt = false;
            }
        }

        if (matchesSearch && matchesLocation && matchesCourt) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }
    }
};

async function loadFeedbackCounts(playerId) {
    try {
        const playerRef = doc(db, "players", playerId);
        const playerDoc = await getDoc(playerRef);
        
        if (playerDoc.exists()) {
            const data = playerDoc.data();
            const feedback = data.feedback || { agree: 0, disagree: 0 };
            
            document.getElementById('agreeCount').textContent = feedback.agree || 0;
            document.getElementById('disagreeCount').textContent = feedback.disagree || 0;
        }
    } catch (error) {
        console.error('Error loading feedback counts:', error);
        document.getElementById('agreeCount').textContent = '0';
        document.getElementById('disagreeCount').textContent = '0';
    }
}

// --- INITIALIZE STYLES ON PAGE LOAD ---
document.addEventListener('DOMContentLoaded', function() {
    addAchievementStyles();
    console.log('Achievement styles added');
    
    // Initialize Sign-Up dropdown
    const signupDropdownBtn = document.getElementById('signupDropdownBtn');
    const signupDropdown = document.getElementById('signupDropdown');
    
    if (signupDropdownBtn && signupDropdown) {
        // Toggle dropdown on button click
        signupDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            signupDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!signupDropdown.contains(e.target)) {
                signupDropdown.classList.remove('active');
            }
        });
        
        // Close dropdown when pressing Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                signupDropdown.classList.remove('active');
            }
        });
    }
});

// --- SIGN-UP HANDLERS ---
window.handleCommitteeSignup = function() {
    console.log('Committee signup requested');
    // Check if user is logged in
    if (currentUser) {
        // User is logged in, redirect to admin registration page
        window.location.href = 'committee-registration.html';
    } else {
        // User is not logged in, redirect to public registration page
        window.location.href = 'public-committee-registration.html';
    }
};

window.handleUmpireSignup = function() {
    console.log('Umpire signup requested - disabled');
    // Do nothing - this is a future feature
    // Could show a message or modal in the future
    // alert('Umpire registration will be available in a future update!');
};
