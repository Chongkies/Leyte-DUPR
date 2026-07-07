// Import the functions you need from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, where, doc, updateDoc, getDoc, addDoc, deleteDoc, setDoc, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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

// --- AUTHENTICATION CHECK ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log('User logged in:', user.email);
        
        // Check if user is admin
        checkAdminStatus();
        
        // Show match recording panel, hide login required
        document.getElementById('loginRequired').style.display = 'none';
        document.getElementById('matchRecordingPanel').style.display = 'block';
        
        // Load players for match logger
        loadMatchLoggerPlayers();
        
    } else {
        currentUser = null;
        isAdmin = false;
        console.log('No user logged in');
        
        // Show login required, hide match recording panel
        document.getElementById('loginRequired').style.display = 'flex';
        document.getElementById('matchRecordingPanel').style.display = 'none';
    }
});

// --- CHECK ADMIN STATUS ---
async function checkAdminStatus() {
    if (!currentUser) return;
    
    try {
        const userDoc = await getDoc(doc(db, "user_roles", currentUser.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            isAdmin = userData.role === 'admin' || userData.role === 'committee';
            console.log('User admin status:', isAdmin);
        } else {
            isAdmin = false;
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
        isAdmin = false;
    }
}

// --- LOGIN FUNCTION ---
window.performLogin = async function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Login successful');
        
        // Clear login form
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
};

// --- LOGOUT FUNCTION ---
window.logout = async function() {
    try {
        await signOut(auth);
        console.log('Logout successful');
    } catch (error) {
        console.error('Logout error:', error);
        alert("Error logging out: " + error.message);
    }
};

// --- LOAD MATCH LOGGER PLAYERS ---
window.loadMatchLoggerPlayers = async function() {
    console.log('🔍 Loading players for doubles match logger...');
    
    // Check if DOM is ready
    if (document.readyState !== 'complete') {
        console.log('⏳ DOM not ready, waiting...');
        setTimeout(loadMatchLoggerPlayers, 100);
        return;
    }
    
    try {
        const playersQuery = query(collection(db, "players"), orderBy("name", "asc"));
        const querySnapshot = await getDocs(playersQuery);
        
        console.log(`📊 Found ${querySnapshot.size} players in database`);
        
        const dropdownIds = ['teamAPlayer1', 'teamAPlayer2', 'teamBPlayer1', 'teamBPlayer2'];
        const dropdowns = dropdownIds.map(id => document.getElementById(id));
        
        // Enhanced null checking
        const missingDropdowns = dropdownIds.filter((id, index) => !dropdowns[index]);
        if (missingDropdowns.length > 0) {
            console.log('❌ Missing dropdown elements:', missingDropdowns);
            console.log('❌ Available elements:', dropdownIds.map(id => document.getElementById(id) ? id : `${id} (null)`));
            return;
        }
        
        // Store current selections
        const currentSelections = dropdowns.map(d => d.value);
        
        // Clear and populate dropdowns
        dropdowns.forEach((dropdown, index) => {
            if (dropdown) {
                dropdown.innerHTML = `<option value="">Select Player ${(index % 2) + 1}</option>`;
            } else {
                console.log(`❌ Dropdown ${index} is null`);
            }
        });
        
        if (querySnapshot.empty) {
            console.log('❌ No players found in database');
            return;
        }
        
        // Create player options
        const playerDocs = querySnapshot.docs;
        const players = playerDocs.map(doc => {
            const data = doc.data();
            const dynamicRating = parseFloat(data.dynamicRating || data.skillRating || 0);
            const skillRating = parseFloat(data.skillRating || 0);
            
            // Validate and fix NaN values
            const validDynamicRating = isNaN(dynamicRating) ? 0 : dynamicRating;
            const validSkillRating = isNaN(skillRating) ? 0 : skillRating;
            
            return {
                id: doc.id,
                name: data.name || 'Unknown',
                dynamicRating: validDynamicRating,
                skillRating: validSkillRating
            };
        });
        
        console.log(`📝 Created ${players.length} player options`);
        
        // Populate dropdowns
        dropdowns.forEach((dropdown) => {
            players.forEach(player => {
                const option = document.createElement('option');
                option.value = player.id;
                option.textContent = `${player.name} (Fixed: ${player.skillRating.toFixed(3)}, Live: ${player.dynamicRating.toFixed(3)})`;
                dropdown.appendChild(option);
            });
        });
        
        // Restore selections
        dropdowns.forEach((dropdown, index) => {
            if (currentSelections[index]) {
                dropdown.value = currentSelections[index];
            }
        });
        
        console.log('✅ Successfully loaded players into match logger dropdowns');
        
    } catch (error) {
        console.error('❌ Error loading match logger players:', error);
    }
};

// --- VALIDATE PLAYER SELECTION ---
function validateDoublesPlayerSelection() {
    const teamA1 = document.getElementById('teamAPlayer1').value;
    const teamA2 = document.getElementById('teamAPlayer2').value;
    const teamB1 = document.getElementById('teamBPlayer1').value;
    const teamB2 = document.getElementById('teamBPlayer2').value;
    
    const selectedPlayers = [teamA1, teamA2, teamB1, teamB2].filter(id => id);
    const uniquePlayers = [...new Set(selectedPlayers)];
    
    if (selectedPlayers.length !== uniquePlayers.length) {
        return { valid: false, error: 'The same player cannot be selected twice in a match.' };
    }
    
    return { valid: true };
}

// --- SHOW VALIDATION ERROR ---
function showValidationError(message) {
    const errorDiv = document.getElementById('validationError');
    if (errorDiv) {
        errorDiv.textContent = '⚠️ ' + message;
        errorDiv.style.display = 'block';
    }
}

// --- HIDE VALIDATION ERROR ---
function hideValidationError() {
    const errorDiv = document.getElementById('validationError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// --- UPDATE DOUBLES MATCH PREVIEW ---
window.updateDoublesMatchPreview = function() {
    const teamA1 = document.getElementById('teamAPlayer1');
    const teamA2 = document.getElementById('teamAPlayer2');
    const teamB1 = document.getElementById('teamBPlayer1');
    const teamB2 = document.getElementById('teamBPlayer2');
    const teamAScore = parseInt(document.getElementById('teamAScore').value);
    const teamBScore = parseInt(document.getElementById('teamBScore').value);
    const tournamentType = document.getElementById('tournamentType').value;
    
    const preview = document.getElementById('matchPreview');
    const previewContent = document.getElementById('matchPreviewContent');
    
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
        showValidationError(duplicateCheck.error);
        preview.style.display = 'none';
        return;
    }
    
    // Check scores
    if (isNaN(teamAScore) || isNaN(teamBScore)) {
        preview.style.display = 'none';
        return;
    }
    
    // Get player names and ratings from selected options
    const teamA1Option = teamA1.options[teamA1.selectedIndex];
    const teamA2Option = teamA2.options[teamA2.selectedIndex];
    const teamB1Option = teamB1.options[teamB1.selectedIndex];
    const teamB2Option = teamB2.options[teamB2.selectedIndex];
    
    const teamA1Name = teamA1Option.text.split(' (')[0];
    const teamA2Name = teamA2Option.text.split(' (')[0];
    const teamB1Name = teamB1Option.text.split(' (')[0];
    const teamB2Name = teamB2Option.text.split(' (')[0];
    
    // Parse ratings from the dropdown text format: "Name (Fixed: X.XXX, Live: X.XXX)"
    const parseRatingFromText = (text) => {
        const liveMatch = text.match(/Live: ([\d.]+)/);
        return liveMatch ? parseFloat(liveMatch[1]) : 0;
    };
    
    const teamA1Rating = parseRatingFromText(teamA1Option.text);
    const teamA2Rating = parseRatingFromText(teamA2Option.text);
    const teamB1Rating = parseRatingFromText(teamB1Option.text);
    const teamB2Rating = parseRatingFromText(teamB2Option.text);
    
    // Calculate Elo components
    const avgA = parseFloat(((teamA1Rating + teamA2Rating) / 2).toFixed(3));
    const avgB = parseFloat(((teamB1Rating + teamB2Rating) / 2).toFixed(3));
    
    // Expected Score using Elo formula
    const expectedA = parseFloat((1 / (1 + Math.pow(10, (avgB - avgA) / 1.0))).toFixed(6));
    const expectedB = parseFloat((1 / (1 + Math.pow(10, (avgA - avgB) / 1.0))).toFixed(6));
    
    // Actual Score based on match results
    const actualA = parseFloat((teamAScore / (teamAScore + teamBScore)).toFixed(6));
    const actualB = parseFloat((teamBScore / (teamAScore + teamBScore)).toFixed(6));
    
    // Tournament Weight
    const weight = tournamentType === 'major' ? 1.5 : tournamentType === 'minor' ? 1.0 : 0.5;
    
    // Calculate rating change using Elo formula
    const calculatedChange = parseFloat((Math.abs(0.100 * (actualA - expectedA) * weight)).toFixed(3));
    
    const teamAWins = teamAScore > teamBScore;
    const winnerTeam = teamAWins ? `${teamA1Name} & ${teamA2Name}` : `${teamB1Name} & ${teamB2Name}`;
    const loserTeam = teamAWins ? `${teamB1Name} & ${teamB2Name}` : `${teamA1Name} & ${teamA2Name}`;
    
    previewContent.innerHTML = `
        <strong style="color: #2e7d32;">Team A:</strong> ${teamA1Name} (${teamA1Rating}) & ${teamA2Name} (${teamA2Rating})<br>
        <strong style="color: #e65100;">Team B:</strong> ${teamB1Name} (${teamB1Rating}) & ${teamB2Name} (${teamB2Rating})<br>
        <strong>Score:</strong> ${teamAScore} - ${teamBScore}<br>
        <br>
        <strong>Team Averages:</strong> ${avgA} vs ${avgB}<br>
        <strong>Expected:</strong> ${expectedA.toFixed(3)} vs ${expectedB.toFixed(3)}<br>
        <strong>Actual:</strong> ${actualA.toFixed(3)} vs ${actualB.toFixed(3)}<br>
        <strong>Weight:</strong> ${weight}x (${tournamentType === 'major' ? 'Major' : tournamentType === 'minor' ? 'Minor' : 'Money Game'})<br>
        <br>
        <strong>Winner:</strong> ${winnerTeam}<br>
        <strong>Loser:</strong> ${loserTeam}<br>
        <br>
        <span style="color: green; font-weight: 600;">✓ Winning team: +${calculatedChange.toFixed(3)} each</span><br>
        <span style="color: red; font-weight: 600;">✗ Losing team: -${calculatedChange.toFixed(3)} each</span>
    `;
    
    preview.style.display = 'block';
};

// --- UPDATE MATCH PREVIEW ---
function updateMatchPreview() {
    // Use the comprehensive preview function
    updateDoublesMatchPreview();
}

// --- RECORD DOUBLES MATCH ---
window.recordDoublesMatch = async function() {
    const recordButton = event.target;
    const originalText = recordButton.textContent;
    
    // Set loading state
    recordButton.disabled = true;
    recordButton.innerHTML = '<span class="spinner"></span> Recording Match...';
    
    hideValidationError();
    
    try {
        // Get all player IDs
        const teamAPlayer1Id = document.getElementById('teamAPlayer1').value;
        const teamAPlayer2Id = document.getElementById('teamAPlayer2').value;
        const teamBPlayer1Id = document.getElementById('teamBPlayer1').value;
        const teamBPlayer2Id = document.getElementById('teamBPlayer2').value;
        
        // Get scores and parse as integers
        const teamAScore = parseInt(document.getElementById('teamAScore').value, 10);
        const teamBScore = parseInt(document.getElementById('teamBScore').value, 10);
        
        // Get tournament type
        const tournamentType = document.getElementById('tournamentType').value;
        const isMajor = tournamentType === 'major';
        const isMinor = tournamentType === 'minor';
        const isMoneyGame = tournamentType === 'money-game';
        
        // Validation: All players selected
        if (!teamAPlayer1Id || !teamAPlayer2Id || !teamBPlayer1Id || !teamBPlayer2Id) {
            showValidationError('Please select all 4 players');
            recordButton.disabled = false;
            recordButton.textContent = originalText;
            return;
        }
        
        // Validation: No duplicate players (explicit check)
        const allPlayerIds = [teamAPlayer1Id, teamAPlayer2Id, teamBPlayer1Id, teamBPlayer2Id];
        const uniquePlayerIds = [...new Set(allPlayerIds)];
        if (allPlayerIds.length !== uniquePlayerIds.length) {
            showValidationError('The same player cannot be selected twice in a match.');
            console.error('Duplicate player selection detected:', allPlayerIds);
            recordButton.disabled = false;
            recordButton.textContent = originalText;
            return;
        }
        
        // Validation: Valid scores
        if (isNaN(teamAScore) || isNaN(teamBScore) || teamAScore < 0 || teamBScore < 0) {
            showValidationError('Please enter valid scores');
            recordButton.disabled = false;
            recordButton.textContent = originalText;
            return;
        }
        
        // Validation: Different scores (no ties)
        if (teamAScore === teamBScore) {
            showValidationError('Scores cannot be tied. Please enter different scores.');
            recordButton.disabled = false;
            recordButton.textContent = originalText;
            return;
        }
        
        console.log('Starting doubles match recording...');
        console.log('Team A Players:', teamAPlayer1Id, teamAPlayer2Id);
        console.log('Team B Players:', teamBPlayer1Id, teamBPlayer2Id);
        console.log('Scores:', teamAScore, '-', teamBScore);
        console.log('Is Major:', isMajor);
        
        // Get all player documents
        const playerIds = [teamAPlayer1Id, teamAPlayer2Id, teamBPlayer1Id, teamBPlayer2Id];
        const playerDocs = await Promise.all(
            playerIds.map(id => getDoc(doc(db, "players", id)))
        );
        
        // Check all players exist
        if (playerDocs.some(doc => !doc.exists())) {
            showValidationError('One or more players not found');
            recordButton.disabled = false;
            recordButton.textContent = originalText;
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
        
        console.log('All players loaded:', players.map(p => `${p.name} (${p.dynamicRating})`));
        
        // Determine winner and loser teams
        const teamAWins = teamAScore > teamBScore;
        const winnerTeam = teamAWins ? [players[0], players[1]] : [players[2], players[3]];
        const loserTeam = teamAWins ? [players[2], players[3]] : [players[0], players[1]];
        const winnerScore = teamAWins ? teamAScore : teamBScore;
        const loserScore = teamAWins ? teamBScore : teamAScore;
        
        // Calculate team average ratings using parseFloat with NaN validation
        const winnerAvgRating = parseFloat(((winnerTeam[0].dynamicRating + winnerTeam[1].dynamicRating) / 2).toFixed(3));
        const loserAvgRating = parseFloat(((loserTeam[0].dynamicRating + loserTeam[1].dynamicRating) / 2).toFixed(3));
        
        // Validate team averages
        if (isNaN(winnerAvgRating) || isNaN(loserAvgRating)) {
            showValidationError('Invalid player ratings detected. Please ensure all selected players have valid ratings.');
            recordButton.disabled = false;
            recordButton.textContent = originalText;
            return;
        }
        
        // Calculate spread and rating change using Elo system
        // Team Averages
        const avgA = parseFloat(((players[0].dynamicRating + players[1].dynamicRating) / 2).toFixed(3));
        const avgB = parseFloat(((players[2].dynamicRating + players[3].dynamicRating) / 2).toFixed(3));
        
        // Validate team averages for Elo calculation
        if (isNaN(avgA) || isNaN(avgB)) {
            showValidationError('Invalid team averages for Elo calculation. Please check player ratings.');
            recordButton.disabled = false;
            recordButton.textContent = originalText;
            return;
        }
        
        // Expected Score using Elo formula
        const expectedA = parseFloat((1 / (1 + Math.pow(10, (avgB - avgA) / 1.0))).toFixed(6));
        const expectedB = parseFloat((1 / (1 + Math.pow(10, (avgA - avgB) / 1.0))).toFixed(6));
        
        // Actual Score based on match results
        const actualA = parseFloat((teamAScore / (teamAScore + teamBScore)).toFixed(6));
        const actualB = parseFloat((teamBScore / (teamAScore + teamBScore)).toFixed(6));
        
        // Tournament Weight: 0.5 for Money Games, 1.0 for Minor, 1.5 for Major
        const weight = isMajor ? 1.5 : isMinor ? 1.0 : 0.5;
        
        // Calculate rating change using Elo formula
        const calculatedChange = parseFloat((Math.abs(0.100 * (actualA - expectedA) * weight)).toFixed(3));
        
        console.log('=== DOUBLES MATCH CALCULATION (ELO SYSTEM) ===');
        console.log('Team A:', players[0].name + ' (' + players[0].dynamicRating + ') & ' + players[1].name + ' (' + players[1].dynamicRating + ')');
        console.log('Team B:', players[2].name + ' (' + players[2].dynamicRating + ') & ' + players[3].name + ' (' + players[3].dynamicRating + ')');
        console.log('Team A Average:', avgA);
        console.log('Team B Average:', avgB);
        console.log('Expected A:', expectedA, 'Expected B:', expectedB);
        console.log('Actual A:', actualA, 'Actual B:', actualB);
        console.log('Winner Score:', winnerScore);
        console.log('Loser Score:', loserScore);
        console.log('Weight:', weight);
        console.log('*** Rating Change: ±' + calculatedChange + ' ***');
        
        // Create batch for atomic updates
        const batch = writeBatch(db);
        
        // Update ratings using Elo system
        // Team A players
        for (let i = 0; i < 2; i++) {
            const player = players[i];
            const playerChange = teamAWins ? calculatedChange : -calculatedChange;
            const newRating = parseFloat((player.dynamicRating + playerChange).toFixed(3));
            const playerRef = doc(db, "players", player.id);
            
            console.log(`Updating Team A player ${player.name}: ${player.dynamicRating} -> ${newRating} (${playerChange > 0 ? '+' : ''}${playerChange})`);
            
            batch.update(playerRef, {
                dynamicRating: Number(newRating),
                lastUpdated: new Date()
            });
        }
        
        // Team B players
        for (let i = 2; i < 4; i++) {
            const player = players[i];
            const playerChange = !teamAWins ? calculatedChange : -calculatedChange;
            const newRating = parseFloat((player.dynamicRating + playerChange).toFixed(3));
            const playerRef = doc(db, "players", player.id);
            
            console.log(`Updating Team B player ${player.name}: ${player.dynamicRating} -> ${newRating} (${playerChange > 0 ? '+' : ''}${playerChange})`);
            
            batch.update(playerRef, {
                dynamicRating: Number(newRating),
                lastUpdated: new Date()
            });
        }
        
        // Commit batch update
        await batch.commit();
        console.log('✓ Batch commit successful - All player ratings updated');
        
        // Create match record for global matches collection
        const matchRecord = {
            type: 'doubles',
            teamA: {
                player1Id: teamAPlayer1Id,
                player2Id: teamAPlayer2Id,
                avgRating: avgA,
                expectedScore: expectedA,
                actualScore: actualA
            },
            teamB: {
                player1Id: teamBPlayer1Id,
                player2Id: teamBPlayer2Id,
                avgRating: avgB,
                expectedScore: expectedB,
                actualScore: actualB
            },
            teamAScore: teamAScore,
            teamBScore: teamBScore,
            winner: teamAWins ? 'A' : 'B',
            weight: weight,
            ratingChange: calculatedChange,
            teamAAvgRating: avgA,
            teamBAvgRating: avgB,
            expectedA: expectedA,
            expectedB: expectedB,
            actualA: actualA,
            actualB: actualB,
            tournamentType: tournamentType,
            timestamp: new Date()
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
            
            // Calculate individual player change
            const playerChange = isWinner ? calculatedChange : -calculatedChange;
            
            const playerMatchRecord = {
                matchId: globalMatchRef.id,
                type: 'doubles',
                teammates: [{ id: teammate.id, name: teammate.name }],
                opponents: opponents.map(o => ({ id: o.id, name: o.name })),
                teamAScore: teamAScore,
                teamBScore: teamBScore,
                isWinner: isWinner,
                ratingChange: playerChange,
                newDynamicRating: Number(parseFloat((player.dynamicRating + playerChange).toFixed(3))),
                isMajor: isMajor,
                tournamentType: tournamentType,
                // Elo calculation data
                teamAvgRating: isTeamA ? avgA : avgB,
                opponentAvgRating: isTeamA ? avgB : avgA,
                expectedScore: isTeamA ? expectedA : expectedB,
                actualScore: isTeamA ? actualA : actualB,
                weight: weight,
                timestamp: new Date()
            };
            
            await addDoc(collection(db, "players", player.id, "matchHistory"), playerMatchRecord);
            console.log(`✓ Match history saved for ${player.name} with change: ${playerChange > 0 ? '+' : ''}${playerChange}`);
        }
        
        console.log('✓ Match recorded to all player histories');
        
        // Show success message ONLY after batch.commit() is successful
        const winnerNames = winnerTeam.map(p => p.name).join(' & ');
        const loserNames = loserTeam.map(p => p.name).join(' & ');
        
        showSuccess(`✅ Doubles Match Recorded Successfully!\n\nWinner: ${winnerNames}\nLoser: ${loserNames}\nScore: ${winnerScore} - ${loserScore}\n\nRating Change: ±${calculatedChange.toFixed(3)} points for each player`);
        
        // Clear the form
        clearMatchForm();
        
        // Refresh player dropdowns to show updated ratings
        loadMatchLoggerPlayers();
        
    } catch (error) {
        console.error('❌ Error recording doubles match:', error);
        console.error('Error stack:', error.stack);
        showValidationError('Error recording match: ' + error.message);
    } finally {
        // Reset button state
        recordButton.disabled = false;
        recordButton.textContent = originalText;
    }
};

// --- CLEAR MATCH FORM ---
window.clearMatchForm = function() {
    document.getElementById('teamAPlayer1').value = '';
    document.getElementById('teamAPlayer2').value = '';
    document.getElementById('teamBPlayer1').value = '';
    document.getElementById('teamBPlayer2').value = '';
    document.getElementById('teamAScore').value = '';
    document.getElementById('teamBScore').value = '';
    document.getElementById('tournamentType').value = 'minor';
    
    // Hide preview and validation error
    const preview = document.getElementById('matchPreview');
    if (preview) preview.style.display = 'none';
    hideValidationError();
    
    console.log('Doubles match form cleared');
};

// --- SHOW SUCCESS ---
function showSuccess(message) {
    // Create a temporary success message
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4caf50, #45a049);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 5000);
}

// --- MATCH HISTORY MANAGEMENT ---
window.loadMatchHistory = async function() {
    console.log('🔄 Loading match history...');
    
    try {
        const playerFilter = document.getElementById('historyPlayerFilter').value;
        const tournamentFilter = document.getElementById('historyTournamentFilter').value;
        const sortBy = document.getElementById('historySortBy').value;
        
        // Fetch all matches first
        let matchesQuery = query(collection(db, "matches"), orderBy("timestamp", "desc"));
        
        const querySnapshot = await getDocs(matchesQuery);
        let matches = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Apply filters in JavaScript (since Firestore has index issues)
        if (playerFilter) {
            matches = matches.filter(match => {
                // Check if match contains the selected player
                const playerIds = match.playerIds || match.players || [];
                return playerIds.includes(playerFilter);
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
        
        displayMatchHistory(matches);
        
    } catch (error) {
        console.error('❌ Error loading match history:', error);
        showValidationError('Error loading match history: ' + error.message);
    }
};

window.displayMatchHistory = async function(matches) {
    const container = document.getElementById('matchHistoryList');
    
    if (matches.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">No matches found</div>';
        return;
    }
    
    // Fetch all player data once
    const allPlayerDocs = await getDocs(collection(db, "players"));
    const allPlayers = {};
    allPlayerDocs.forEach(doc => {
        allPlayers[doc.id] = { id: doc.id, ...doc.data() };
    });
    
    console.log('🔍 Available players:', Object.keys(allPlayers).length);
    
    container.innerHTML = matches.map((match, matchIndex) => {
        // Safe date handling with fallback
        let date;
        try {
            date = new Date(match.timestamp);
        } catch (error) {
            console.warn('Invalid date format for match:', match.timestamp, error);
            date = new Date(); // Fallback to current date
        }
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        const tournamentTypeClass = match.tournamentType === 'major' ? 'tournament-major' : 
                                   match.tournamentType === 'minor' ? 'tournament-minor' : 'tournament-money-game';
        
        const ratingChangeClass = match.ratingChange >= 0 ? 'rating-change-positive' : 'rating-change-negative';
        
        // Get player IDs from match data
        const playerIds = match.playerIds || match.players || [];
        console.log(`🔍 Match ${matchIndex} player IDs:`, playerIds);
        
        // Convert player IDs to player objects
        const players = playerIds.map(playerId => {
            const playerData = allPlayers[playerId];
            if (playerData) {
                return playerData;
            } else {
                console.warn(`⚠️ Player ${playerId} not found in database`);
                return { id: playerId, name: 'Unknown Player', dynamicRating: 'N/A' };
            }
        });
        
        // Determine winner and loser teams
        const winnerTeam = match.winner === 'A' ? [players[0], players[1]] : [players[2], players[3]];
        const loserTeam = match.winner === 'A' ? [players[2], players[3]] : [players[0], players[1]];
        
        console.log(`🔍 Match ${matchIndex} winner team:`, winnerTeam.map(p => p ? p.name : 'Unknown Player'));
        console.log(`🔍 Match ${matchIndex} loser team:`, loserTeam.map(p => p ? p.name : 'Unknown Player'));
        
        // Safely get player names with fallback
        const getPlayerName = (player) => {
            if (!player) return 'Unknown Player';
            if (typeof player === 'string') return player;
            if (player && player.name) return player.name;
            if (player && player.playerName) return player.playerName;
            return 'Unknown Player';
        };
        
        // Safely get player info for display
        const getPlayerInfo = (player) => {
            if (!player) return { name: 'Unknown Player', rating: 'N/A' };
            return {
                name: getPlayerName(player),
                rating: player.dynamicRating || player.skillRating || player.rating || 'N/A'
            };
        };
        
        return `
            <div class="match-history-item">
                <div class="match-history-header">
                    <div>
                        <div class="match-history-title">${match.tournamentName || 'Match'}</div>
                        <div class="match-history-subtitle">${formattedDate}</div>
                    </div>
                    <div class="tournament-badge ${tournamentTypeClass}">
                        ${match.tournamentType === 'major' ? 'MAJOR' : 
                          match.tournamentType === 'minor' ? 'MINOR' : 'MONEY GAME'}
                    </div>
                </div>
                
                <div class="match-details">
                    <div class="match-info">
                        <div class="match-info-label">Winner</div>
                        <div class="match-info-value">
                            <div class="match-players">
                                ${winnerTeam.map(p => `<span class="player-tag">${getPlayerName(p)}</span>`).join(' & ')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="match-info">
                        <div class="match-info-label">Score</div>
                        <div class="match-info-value">${match.teamAScore} - ${match.teamBScore}</div>
                    </div>
                    
                    <div class="match-info">
                        <div class="match-info-label">Current Ratings</div>
                        <div class="match-info-value">
                            <div class="match-players" style="display: flex; gap: 10px; flex-wrap: wrap;">
                                ${winnerTeam.map(p => `
                                    <div style="display: flex; align-items: center; gap: 5px;">
                                        <span class="player-tag">${getPlayerName(p)}</span>
                                        <span style="font-size: 0.8rem; color: var(--text-secondary);">
                                            ${getPlayerInfo(p).rating}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="match-info">
                        <div class="match-info-label">Rating Change</div>
                        <div class="match-info-value">
                            <div class="match-rating-change ${ratingChangeClass}">
                                ${match.ratingChange > 0 ? '+' : ''}${match.ratingChange.toFixed(3)}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="match-actions">
                    <button onclick="deleteMatch('${match.id}', '${JSON.stringify(match.ratingChange)}', '${JSON.stringify(playerIds)}')" class="delete-match-btn">
                        🗑️ Delete Match
                    </button>
                </div>
            </div>
        `;
    }).join('');
};

// --- DELETE MATCH WITH DYNAMIC RATING ADJUSTMENT ---
window.deleteMatch = async function(matchId, ratingChange, playersData) {
    if (!confirm('Are you sure you want to delete this match? This will reverse the rating changes and adjust player dynamic ratings accordingly.')) {
        return;
    }
    
    try {
        console.log(`🗑️ Deleting match ${matchId} and adjusting ratings...`);
        
        // Delete the match from global collection
        await deleteDoc(doc(db, "matches", matchId));
        
        // Parse players data
        const players = JSON.parse(playersData);
        
        // Update each player's match history and dynamic rating
        for (const player of players) {
            try {
                // Find and delete the match from player's match history
                const playerMatchHistoryQuery = query(collection(db, "players", player.id, "matchHistory"), where("matchId", "==", matchId));
                const matchHistorySnapshot = await getDocs(playerMatchHistoryQuery);
                
                if (!matchHistorySnapshot.empty) {
                    const matchDoc = matchHistorySnapshot.docs[0];
                    await deleteDoc(matchDoc.ref);
                    
                    console.log(`✓ Deleted match from ${player.name}'s history`);
                }
                
                // Recalculate player's dynamic rating
                await recalculatePlayerDynamicRating(player.id);
                
            } catch (error) {
                console.error(`Error updating ${player.name}:`, error);
            }
        }
        
        // Refresh match history display
        await loadMatchHistory();
        
        showSuccess('✅ Match deleted and player dynamic ratings adjusted successfully!');
        
    } catch (error) {
        console.error('❌ Error deleting match:', error);
        showValidationError('Error deleting match: ' + error.message);
    }
};

// --- RECALCULATE PLAYER DYNAMIC RATING ---
window.recalculatePlayerDynamicRating = async function(playerId) {
    try {
        console.log(`🔄 Recalculating dynamic rating for player ${playerId}`);
        
        // Get current player data
        const playerDoc = await getDoc(doc(db, "players", playerId));
        const player = playerDoc.data();
        
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
};

// --- FILTER MATCH HISTORY ---
window.filterMatchHistory = function() {
    loadMatchHistory();
};

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM Content Loaded - Initializing match recording...');
    
    // Load players for match logger
    loadMatchLoggerPlayers();
    
    // Load match history
    loadMatchHistory();
    
    // Add change listeners to update match preview
    const dropdowns = ['teamAPlayer1', 'teamAPlayer2', 'teamBPlayer1', 'teamBPlayer2'];
    dropdowns.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updateDoublesMatchPreview);
        }
    });
    
    // Add input listeners for scores
    const scoreInputs = ['teamAScore', 'teamBScore'];
    scoreInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateDoublesMatchPreview);
        }
    });
    
    // Add change listener for tournament type
    const tournamentTypeElement = document.getElementById('tournamentType');
    if (tournamentTypeElement) {
        tournamentTypeElement.addEventListener('change', updateDoublesMatchPreview);
    }
    
    // Add filter listeners
    const historyPlayerFilter = document.getElementById('historyPlayerFilter');
    const historyTournamentFilter = document.getElementById('historyTournamentFilter');
    const historySortBy = document.getElementById('historySortBy');
    
    if (historyPlayerFilter) {
        historyPlayerFilter.addEventListener('change', filterMatchHistory);
    }
    if (historyTournamentFilter) {
        historyTournamentFilter.addEventListener('change', filterMatchHistory);
    }
    if (historySortBy) {
        historySortBy.addEventListener('change', filterMatchHistory);
    }
});

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
    };
