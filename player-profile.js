import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- PLAYER PROFILE FUNCTIONS ---
window.loadPlayerProfile = async function(playerId) {
    try {
        console.log('Loading player profile:', playerId);
        
        // Get player document (using initialized db from HTML)
        const playerRef = doc(db, "players", playerId);
        const playerDoc = await getDoc(playerRef);
        
        if (!playerDoc.exists()) {
            document.getElementById('playerName').textContent = 'Player Not Found';
            return;
        }
        
        const player = playerDoc.data();
        
        // Update basic info
        document.getElementById('playerName').textContent = player.name || 'Unknown Player';
        document.getElementById('playerNameDisplay').textContent = player.name || 'Unknown Player';
        document.getElementById('currentRating').textContent = (player.dynamicRating || player.skillRating || 0).toFixed(3);
        document.getElementById('primaryCourt').textContent = player.primaryCourt || 'No Court';
        document.getElementById('totalMatches').textContent = player.totalMatches || 0;
        document.getElementById('winRate').textContent = player.totalMatches > 0 ? 
            ((player.wins || 0) / player.totalMatches * 100).toFixed(1) + '%' : '0%';
        document.getElementById('currentStreak').textContent = player.currentStreak || 0;
        
        // Calculate and display progress
        const progress = await calculatePlayerProgress(playerId);
        displayProgressInfo(progress);
        
        // Draw rating chart
        drawRatingChart(progress);
        
    } catch (error) {
        console.error('Error loading player profile:', error);
        document.getElementById('playerName').textContent = 'Error Loading Profile';
    }
};

window.displayProgressInfo = function(progress) {
    // Update rating display
    document.getElementById('progressRating').textContent = progress.currentRating.toFixed(3);
    
    // Update rating change
    const ratingChangeElement = document.getElementById('ratingChange');
    const weeklyChange = progress.weeklyChange;
    
    if (weeklyChange > 0) {
        ratingChangeElement.className = 'rating-change positive';
        ratingChangeElement.innerHTML = `
            <span class="change-label">This Week:</span>
            <span class="change-value">↑ +${Math.abs(weeklyChange).toFixed(3)}</span>
        `;
    } else if (weeklyChange < 0) {
        ratingChangeElement.className = 'rating-change negative';
        ratingChangeElement.innerHTML = `
            <span class="change-label">This Week:</span>
            <span class="change-value">↓ ${Math.abs(weeklyChange).toFixed(3)}</span>
        `;
    } else {
        ratingChangeElement.className = 'rating-change';
        ratingChangeElement.innerHTML = `
            <span class="change-label">This Week:</span>
            <span class="change-value">No Change</span>
        `;
    }
    
    // Update stats
    document.getElementById('statWinRate').textContent = (progress.winRate * 100).toFixed(1) + '%';
    
    // Update trends
    const weeklyTrendElement = document.getElementById('weeklyTrend');
    const monthlyTrendElement = document.getElementById('monthlyTrend');
    
    if (progress.weeklyChange > 0) {
        weeklyTrendElement.textContent = '↑ Improving';
        weeklyTrendElement.className = 'stat-value positive';
    } else if (progress.weeklyChange < 0) {
        weeklyTrendElement.textContent = '↓ Declining';
        weeklyTrendElement.className = 'stat-value negative';
    } else {
        weeklyTrendElement.textContent = '→ Stable';
        weeklyTrendElement.className = 'stat-value';
    }
    
    if (progress.monthlyChange > 0) {
        monthlyTrendElement.textContent = '↑ Improving';
        monthlyTrendElement.className = 'stat-value positive';
    } else if (progress.monthlyChange < 0) {
        monthlyTrendElement.textContent = '↓ Declining';
        monthlyTrendElement.className = 'stat-value negative';
    } else {
        monthlyTrendElement.textContent = '→ Stable';
        monthlyTrendElement.className = 'stat-value';
    }
};

window.drawRatingChart = async function(progress) {
    const canvas = document.getElementById('ratingChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Get match history for chart data
    const matchHistory = await getPlayerMatchHistory(getPlayerIdFromURL());
    
    if (matchHistory.length === 0) {
        // Show no data message
        ctx.fillStyle = '#666';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('No rating history available', canvas.width/2, canvas.height/2);
        return;
    }
    
    // Prepare chart data
    const chartData = matchHistory.map((match, index) => ({
        x: index,
        y: match.newRating || 0
    }));
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up chart dimensions
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const chartLeft = padding;
    const chartTop = padding;
    
    // Find min and max values
    const minY = Math.min(...chartData.map(d => d.y));
    const maxY = Math.max(...chartData.map(d => d.y));
    const rangeY = maxY - minY;
    
    // Draw axes
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartTop + chartHeight);
    ctx.lineTo(chartLeft + chartWidth, chartTop + chartHeight);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartTop);
    ctx.lineTo(chartLeft, chartTop + chartHeight);
    ctx.stroke();
    
    // Draw Y-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Inter';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const value = minY + (rangeY / 5) * i;
        const y = chartTop + chartHeight - (value / rangeY) * chartHeight - 20;
        ctx.fillText(value.toFixed(1), chartLeft - 10, y);
    }
    
    // Draw the line chart
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    chartData.forEach((point, index) => {
        const x = chartLeft + (index / (chartData.length - 1)) * chartWidth;
        const y = chartTop + chartHeight - ((point.y - minY) / rangeY) * chartHeight - 20;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw data points
    chartData.forEach((point, index) => {
        const x = chartLeft + (index / (chartData.length - 1)) * chartWidth;
        const y = chartTop + chartHeight - ((point.y - minY) / rangeY) * chartHeight - 20;
        
        // Color based on win/loss
        const match = matchHistory[index];
        ctx.fillStyle = match.result === 'win' ? '#4caf50' : '#ff6b6b';
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
    });
};

function getPlayerIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}
