/**
 * Pitcher Training Tracker - Core Logic (English Version)
 */

// ===== Global Variables =====
const canvas = document.getElementById('strikeZoneCanvas');
const ctx = canvas.getContext('2d');

// ===== Global State =====
let spots = [];
let badSpots = [];
let strikeZoneX, strikeZoneY, strikeZoneWidth, strikeZoneHeight;
let largeZoneX, largeZoneY, largeZoneSize;
let totalPitchesOffset = 0; // Manual offset for totalPitches

// ===== Storage Key =====
const STORAGE_KEY = 'pitcher_training_history';

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('trainingDate').valueAsDate = new Date();
    drawStrikeZone();
    setupEventListeners();
    updateStats();
    loadHistoryList();
});

// ===== Draw Strike Zone =====
function drawStrikeZone() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    largeZoneSize = Math.min(canvas.width, canvas.height) * 0.9;
    largeZoneX = (canvas.width - largeZoneSize) / 2;
    largeZoneY = (canvas.height - largeZoneSize) / 2;

    strikeZoneWidth = largeZoneSize * (2 / 3);
    strikeZoneHeight = largeZoneSize * (2 / 3);
    strikeZoneX = (canvas.width - strikeZoneWidth) / 2;
    strikeZoneY = (canvas.height - strikeZoneHeight) / 2;

    const smallZoneX = strikeZoneX;
    const smallZoneY = strikeZoneY;
    const smallZoneSize = strikeZoneWidth;
    const smallCellW = smallZoneSize / 3;
    const smallCellH = smallZoneSize / 3;

    // Outer zone background (gray - ball area)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(largeZoneX, largeZoneY, largeZoneSize, largeZoneSize);

    // Outer zone grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;

    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(largeZoneX, largeZoneY + i * (largeZoneSize / 3));
        ctx.lineTo(largeZoneX + largeZoneSize, largeZoneY + i * (largeZoneSize / 3));
        ctx.stroke();
    }

    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(largeZoneX + i * (largeZoneSize / 3), largeZoneY);
        ctx.lineTo(largeZoneX + i * (largeZoneSize / 3), largeZoneY + largeZoneSize);
        ctx.stroke();
    }

    // Strike zone background (green)
    ctx.fillStyle = 'rgba(46, 204, 113, 0.15)';
    ctx.fillRect(smallZoneX, smallZoneY, smallZoneSize, smallZoneSize);

    // Strike zone grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;

    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(smallZoneX, smallZoneY + i * smallCellH);
        ctx.lineTo(smallZoneX + smallZoneSize, smallZoneY + i * smallCellH);
        ctx.stroke();
    }

    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(smallZoneX + i * smallCellW, smallZoneY);
        ctx.lineTo(smallZoneX + i * smallCellW, smallZoneY + smallZoneSize);
        ctx.stroke();
    }

    // Strike zone border (red)
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.strokeRect(smallZoneX, smallZoneY, smallZoneSize, smallZoneSize);

    // Outer zone border (blue dashed)
    ctx.setLineDash([8, 5]);
    ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)';
    ctx.lineWidth = 3;
    ctx.strokeRect(largeZoneX, largeZoneY, largeZoneSize, largeZoneSize);
    ctx.setLineDash([]);

    // Labels for strike zone
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';

    const labels = [
        ['High-In', 'High-Mid', 'High-Out'],
        ['Mid-In', 'STRIKE', 'Mid-Out'],
        ['Low-In', 'Low-Mid', 'Low-Out']
    ];

    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const x = smallZoneX + col * smallCellW + smallCellW / 2;
            const y = smallZoneY + row * smallCellH + smallCellH / 2;
            ctx.fillText(labels[row][col], x, y + 4);
        }
    }

    // Ball zone labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.font = '10px Arial';
    ctx.fillText('BALL (High)', canvas.width / 2, largeZoneY - 8);
    ctx.fillText('BALL (Low)', canvas.width / 2, largeZoneY + largeZoneSize + 15);
    ctx.fillText('OUT', largeZoneX - 12, canvas.height / 2);
    ctx.fillText('OUT', largeZoneX + largeZoneSize + 12, canvas.height / 2);

    // Draw saved spots
    spots.forEach((spot, index) => {
        drawSpot(spot.x, spot.y, '#2ecc71', index + 1);
    });

    badSpots.forEach((spot, index) => {
        drawSpot(spot.x, spot.y, '#e67e22', spots.length + index + 1);
    });
}

// ===== Draw Spot =====
function drawSpot(x, y, color = '#ff69b4', number = 1) {
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(number.toString(), x, y + 4);
}

// ===== Canvas Click Handler =====
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const isInLargeZone = x >= largeZoneX && x <= largeZoneX + largeZoneSize &&
                          y >= largeZoneY && y <= largeZoneY + largeZoneSize;

    if (!isInLargeZone) return;

    const isInStrikeZone = x >= strikeZoneX && x <= strikeZoneX + strikeZoneWidth &&
                           y >= strikeZoneY && y <= strikeZoneY + strikeZoneHeight;

    if (isInStrikeZone) {
        spots.push({ x, y });
        // Strike zone: NO auto-increment, keep manual only
    } else {
        // Ball zone: NO auto-increment, keep manual only
        badSpots.push({ x, y });
    }

    drawStrikeZone();
    updateStats();
});

// ===== Event Listeners =====
function setupEventListeners() {
    document.querySelectorAll('.btn-plus').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            // Special handling for totalPitches: adjust offset instead of value
            if (targetId === 'totalPitches') {
                totalPitchesOffset++;
                updateStats();
            } else {
                const target = document.getElementById(targetId);
                target.value = parseInt(target.value || 0) + 1;
                updateStats();
            }
        });
    });

    document.querySelectorAll('.btn-minus').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            // Special handling for totalPitches: adjust offset
            if (targetId === 'totalPitches') {
                totalPitchesOffset = Math.max(-999, totalPitchesOffset - 1);
                updateStats();
            } else {
                const target = document.getElementById(targetId);
                target.value = Math.max(0, parseInt(target.value || 0) - 1);
                updateStats();
            }
        });
    });

    ['goodBalls', 'badBalls', 'strikeouts', 'walks', 'hits', 'runs'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateStats);
    });
    // totalPitches is computed, no input listener needed

    document.getElementById('clearSpots').addEventListener('click', () => {
        spots = [];
        badSpots = [];
        drawStrikeZone();
        updateStats();
    });

    document.getElementById('resetAll').addEventListener('click', () => {
        if (confirm('Reset all data?')) {
            document.getElementById('goodBalls').value = 0;
            document.getElementById('badBalls').value = 0;
            totalPitchesOffset = 0;
            document.getElementById('strikeouts').value = 0;
            document.getElementById('walks').value = 0;
            document.getElementById('hits').value = 0;
            document.getElementById('runs').value = 0;
            document.getElementById('pitcherName').value = '';
            document.getElementById('trainingName').value = '';
            document.getElementById('pitchType').value = '';

            spots = [];
            badSpots = [];
            drawStrikeZone();
            updateStats();
        }
    });

    document.getElementById('exportPDF').addEventListener('click', showPreview);
    document.getElementById('cancelPreview').addEventListener('click', closePreview);
    document.getElementById('downloadPDF').addEventListener('click', exportToPDF);
    document.getElementById('previewModal').addEventListener('click', (e) => {
        if (e.target.id === 'previewModal') closePreview();
    });

    // History buttons
    document.getElementById('toggleHistory').addEventListener('click', toggleHistory);
    document.getElementById('closeHistory').addEventListener('click', closeHistory);
    document.getElementById('historyModal').addEventListener('click', (e) => {
        if (e.target.id === 'historyModal') closeHistory();
    });

    // Save training button
    document.getElementById('saveTraining').addEventListener('click', saveTraining);

    // AI Analysis button
    document.getElementById('aiAnalysis').addEventListener('click', runAIAnalysis);

    // Close AI modal
    document.getElementById('closeAiModal').addEventListener('click', closeAiModal);
    document.getElementById('aiModal').addEventListener('click', (e) => {
        if (e.target.id === 'aiModal') closeAiModal();
    });
}

// ===== Update Stats =====
function updateStats() {
    const goodBalls = parseInt(document.getElementById('goodBalls').value) || 0;
    const badBalls = parseInt(document.getElementById('badBalls').value) || 0;
    // Total = auto sum of goodBalls + badBalls + manual offset
    const autoTotal = goodBalls + badBalls;
    const totalPitches = autoTotal + totalPitchesOffset;
    const strikeouts = parseInt(document.getElementById('strikeouts').value) || 0;
    const walks = parseInt(document.getElementById('walks').value) || 0;
    const hits = parseInt(document.getElementById('hits').value) || 0;
    const runs = parseInt(document.getElementById('runs').value) || 0;

    const goodBallRate = totalPitches > 0 ? ((goodBalls / totalPitches) * 100).toFixed(1) : 0;

    document.getElementById('totalPitches').value = totalPitches;
    document.getElementById('goodBallRate').textContent = goodBallRate + '%';
    document.getElementById('statStrikeouts').textContent = strikeouts;
    document.getElementById('statWalks').textContent = walks;
    document.getElementById('statHits').textContent = hits;
    document.getElementById('statRuns').textContent = runs;
    document.getElementById('markedPitches').textContent = `${spots.length}S / ${badSpots.length}B`;
}

// ===== Save Training =====
function saveTraining() {
    const trainingName = document.getElementById('trainingName').value || 'Training ' + new Date().toISOString().split('T')[0];
    const trainingDate = document.getElementById('trainingDate').value || new Date().toISOString().split('T')[0];
    const pitcherName = document.getElementById('pitcherName').value || 'Unknown';
    const pitchType = document.getElementById('pitchType').value || 'N/A';
    const goodBalls = parseInt(document.getElementById('goodBalls').value) || 0;
    const badBalls = parseInt(document.getElementById('badBalls').value) || 0;
    const totalPitches = parseInt(document.getElementById('totalPitches').value) || 0;
    const strikeouts = parseInt(document.getElementById('strikeouts').value) || 0;
    const walks = parseInt(document.getElementById('walks').value) || 0;
    const hits = parseInt(document.getElementById('hits').value) || 0;
    const runs = parseInt(document.getElementById('runs').value) || 0;

    const record = {
        id: Date.now(),
        trainingName,
        trainingDate,
        pitcherName,
        pitchType,
        goodBalls,
        badBalls,
        totalPitches,
        strikeouts,
        walks,
        hits,
        runs,
        spots: [...spots],
        badSpots: [...badSpots]
    };

    let history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    history.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    loadHistoryList();
    alert('Training saved successfully!');
}

// ===== Load History List =====
function loadHistoryList() {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const listContainer = document.getElementById('historyList');
    const recordCount = document.getElementById('recordCount');

    recordCount.textContent = history.length;

    if (history.length === 0) {
        listContainer.innerHTML = '<p style="color: #999; text-align: center; padding: 10px;">No records yet</p>';
        return;
    }

    const displayRecords = history.slice(0, 3);

    listContainer.innerHTML = displayRecords.map(record => `
        <div class="history-item" onclick="viewHistoryRecord(${record.id})">
            <div class="history-date">${record.trainingDate}</div>
            <div class="history-name">${record.trainingName}</div>
            <div class="history-stats">
                S: ${record.goodBalls} | B: ${record.badBalls} | K: ${record.strikeouts} | BB: ${record.walks || 0} | H: ${record.hits || 0}
            </div>
        </div>
    `).join('');

    if (history.length > 3) {
        listContainer.innerHTML += `<p style="color: #666; text-align: center; padding: 10px; font-size: 12px;">+ ${history.length - 3} more records (click to view details)</p>`;
    }
}

// ===== Toggle History =====
function toggleHistory() {
    const historyList = document.getElementById('historyList');
    const toggleBtn = document.getElementById('toggleHistory');

    if (historyList.style.display === 'none') {
        historyList.style.display = 'block';
        toggleBtn.innerHTML = 'Hide History (<span id="recordCount">' + (JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').length) + '</span>)';
    } else {
        historyList.style.display = 'none';
        toggleBtn.innerHTML = 'Show History (<span id="recordCount">' + (JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').length) + '</span>)';
    }
}

// ===== View History Record =====
function viewHistoryRecord(id) {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const record = history.find(r => r.id === id);

    if (!record) return;

    const detailContainer = document.getElementById('historyDetail');
    const totalPitches = record.totalPitches || (record.goodBalls + record.badBalls);
    const strikeRate = totalPitches > 0 ? ((record.goodBalls / totalPitches) * 100).toFixed(1) : 0;

    const miniCanvasId = 'miniCanvas_' + id;

    detailContainer.innerHTML = `
        <div style="display: flex; gap: 20px;">
            <div style="flex: 1;">
                <h3 style="color: #e74c3c; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">${record.trainingName}</h3>
                <p style="color: #666; margin-bottom: 15px;">
                    Pitcher: ${record.pitcherName} | Date: ${record.trainingDate} | Type: ${record.pitchType}
                </p>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Strikes</td><td style="padding: 8px; text-align: right; font-weight: bold;">${record.goodBalls}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Balls</td><td style="padding: 8px; text-align: right; font-weight: bold;">${record.badBalls}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Total Pitches</td><td style="padding: 8px; text-align: right; font-weight: bold;">${totalPitches}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Strike Rate</td><td style="padding: 8px; text-align: right; font-weight: bold; color: #27ae60;">${strikeRate}%</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Strikeouts</td><td style="padding: 8px; text-align: right; font-weight: bold;">${record.strikeouts}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Walks</td><td style="padding: 8px; text-align: right; font-weight: bold;">${record.walks || 0}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Hits</td><td style="padding: 8px; text-align: right; font-weight: bold;">${record.hits}</td></tr>
                    <tr><td style="padding: 8px; color: #e74c3c;">Runs</td><td style="padding: 8px; text-align: right; font-weight: bold; color: #e74c3c;">${record.runs}</td></tr>
                </table>
                <div style="margin-top: 15px; font-size: 12px; color: #666;">
                    <span style="color: #27ae60;">&#9679;</span> Strikes marked: ${record.spots ? record.spots.length : 0}
                    <span style="color: #e67e22; margin-left: 10px;">&#9679;</span> Balls marked: ${record.badSpots ? record.badSpots.length : 0}
                </div>
            </div>
            <div style="flex: 0 0 250px;">
                <h4 style="color: #e74c3c; text-align: center;">Strike Zone Map</h4>
                <canvas id="${miniCanvasId}" width="200" height="250" style="border: 1px solid #ddd; border-radius: 8px;"></canvas>
            </div>
        </div>
    `;

    setTimeout(() => {
        const miniCanvas = document.getElementById(miniCanvasId);
        if (miniCanvas) {
            const miniCtx = miniCanvas.getContext('2d');
            drawMiniStrikeZone(miniCtx, miniCanvas.width, miniCanvas.height, record.spots, record.badSpots);
        }
    }, 100);

    document.getElementById('historyModal').classList.add('active');
}

// ===== Draw Mini Strike Zone =====
function drawMiniStrikeZone(ctx, width, height, spotsArr, badSpotsArr) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    const zoneSize = Math.min(width, height) * 0.85;
    const zoneX = (width - zoneSize) / 2;
    const zoneY = (height - zoneSize) / 2;
    const smallSize = zoneSize * (2 / 3);
    const smallX = (width - smallSize) / 2;
    const smallY = (height - smallSize) / 2;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(zoneX, zoneY, zoneSize, zoneSize);

    ctx.fillStyle = 'rgba(46, 204, 113, 0.15)';
    ctx.fillRect(smallX, smallY, smallSize, smallSize);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(zoneX, zoneY + i * (zoneSize / 3));
        ctx.lineTo(zoneX + zoneSize, zoneY + i * (zoneSize / 3));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(zoneX + i * (zoneSize / 3), zoneY);
        ctx.lineTo(zoneX + i * (zoneSize / 3), zoneY + zoneSize);
        ctx.stroke();
    }

    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.strokeRect(smallX, smallY, smallSize, smallSize);

    ctx.setLineDash([5, 3]);
    ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)';
    ctx.strokeRect(zoneX, zoneY, zoneSize, zoneSize);
    ctx.setLineDash([]);

    if (spotsArr) {
        spotsArr.forEach((spot) => {
            ctx.beginPath();
            ctx.arc(spot.x * (width / 450), spot.y * (height / 580), 5, 0, Math.PI * 2);
            ctx.fillStyle = '#2ecc71';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }

    if (badSpotsArr) {
        badSpotsArr.forEach((spot) => {
            ctx.beginPath();
            ctx.arc(spot.x * (width / 450), spot.y * (height / 580), 5, 0, Math.PI * 2);
            ctx.fillStyle = '#e67e22';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }
}

// ===== Show History =====
function showHistory() {
    loadHistoryList();
    document.getElementById('historyModal').classList.add('active');
}

// ===== Close History =====
function closeHistory() {
    document.getElementById('historyModal').classList.remove('active');
}

// ===== Show Preview =====
function showPreview() {
    const modal = document.getElementById('previewModal');
    const preview = document.getElementById('pdfPreview');

    const pitcherName = document.getElementById('pitcherName').value || 'Unknown';
    const trainingName = document.getElementById('trainingName').value || 'Training Record';
    const pitchType = document.getElementById('pitchType').value || 'N/A';
    const trainingDate = document.getElementById('trainingDate').value || new Date().toISOString().split('T')[0];

    const goodBalls = parseInt(document.getElementById('goodBalls').value) || 0;
    const badBalls = parseInt(document.getElementById('badBalls').value) || 0;
    const totalPitches = parseInt(document.getElementById('totalPitches').value) || 0;
    const strikeouts = parseInt(document.getElementById('strikeouts').value) || 0;
    const walks = parseInt(document.getElementById('walks').value) || 0;
    const hits = parseInt(document.getElementById('hits').value) || 0;
    const runs = parseInt(document.getElementById('runs').value) || 0;
    const goodBallRate = totalPitches > 0 ? ((goodBalls / totalPitches) * 100).toFixed(1) : 0;

    const canvasData = canvas.toDataURL('image/png');

    preview.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h1 style="text-align: center; color: #e74c3c; margin-bottom: 10px;">Pitcher Training Report</h1>
            <h2 style="text-align: center; margin-bottom: 15px;">${trainingName}</h2>

            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 12px; color: #666;">
                <span>Pitcher: ${pitcherName}</span>
                <span>Date: ${trainingDate}</span>
                <span>Type: ${pitchType}</span>
            </div>

            <div style="display: flex; gap: 20px;">
                <div style="flex: 1;">
                    <div style="border: 2px solid #333; padding: 12px;">
                        <h3 style="margin-bottom: 10px; color: #e74c3c;">Statistics</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <tr><td style="padding: 6px;">Strikes</td><td style="padding: 6px; font-weight: bold; text-align: right;">${goodBalls}</td></tr>
                            <tr><td style="padding: 6px;">Balls</td><td style="padding: 6px; font-weight: bold; text-align: right;">${badBalls}</td></tr>
                            <tr><td style="padding: 6px;">Total Pitches</td><td style="padding: 6px; font-weight: bold; text-align: right;">${totalPitches}</td></tr>
                            <tr><td style="padding: 6px;">Strike Rate</td><td style="padding: 6px; font-weight: bold; text-align: right; color: #27ae60;">${goodBallRate}%</td></tr>
                            <tr><td style="padding: 6px;">Strikeouts</td><td style="padding: 6px; font-weight: bold; text-align: right;">${strikeouts}</td></tr>
                            <tr><td style="padding: 6px;">Walks</td><td style="padding: 6px; font-weight: bold; text-align: right;">${walks}</td></tr>
                            <tr><td style="padding: 6px;">Hits</td><td style="padding: 6px; font-weight: bold; text-align: right;">${hits}</td></tr>
                            <tr><td style="padding: 6px; color: #e74c3c;">Runs</td><td style="padding: 6px; font-weight: bold; text-align: right; color: #e74c3c;">${runs}</td></tr>
                        </table>
                    </div>
                    <div style="margin-top: 15px; text-align: center; color: #666; font-size: 12px;">
                        <span style="color: #27ae60;">&#9679;</span> Strikes: ${spots.length}
                        <span style="color: #e67e22; margin-left: 10px;">&#9679;</span> Balls: ${badSpots.length}
                    </div>
                </div>
                <div style="flex: 0 0 200px;">
                    <h3 style="margin-bottom: 8px; color: #e74c3c; text-align: center;">Strike Zone</h3>
                    <img src="${canvasData}" style="width: 100%; border: 1px solid #ddd; border-radius: 8px;" />
                    <div style="font-size: 10px; color: #999; text-align: center; margin-top: 5px;">
                        Red = Strike Zone | Blue = Ball Area
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

// ===== Close Preview =====
function closePreview() {
    document.getElementById('previewModal').classList.remove('active');
}

// ===== Export PDF =====
function exportToPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let y = margin;

        const pitcherName = document.getElementById('pitcherName').value || 'Unknown';
        const trainingName = document.getElementById('trainingName').value || 'Training Record';
        const pitchType = document.getElementById('pitchType').value || 'N/A';
        const trainingDate = document.getElementById('trainingDate').value || new Date().toISOString().split('T')[0];

        const goodBalls = parseInt(document.getElementById('goodBalls').value) || 0;
        const badBalls = parseInt(document.getElementById('badBalls').value) || 0;
        const totalPitches = parseInt(document.getElementById('totalPitches').value) || 0;
        const strikeouts = parseInt(document.getElementById('strikeouts').value) || 0;
        const walks = parseInt(document.getElementById('walks').value) || 0;
        const hits = parseInt(document.getElementById('hits').value) || 0;
        const runs = parseInt(document.getElementById('runs').value) || 0;
        const goodBallRate = totalPitches > 0 ? ((goodBalls / totalPitches) * 100).toFixed(1) : 0;

        // Title
        doc.setFontSize(20);
        doc.setTextColor(231, 76, 60);
        doc.text('Pitcher Training Report', pageWidth / 2, y, { align: 'center' });
        y += 10;

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(trainingName, pageWidth / 2, y, { align: 'center' });
        y += 7;

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Pitcher: ${pitcherName} | Date: ${trainingDate} | Type: ${pitchType}`, pageWidth / 2, y, { align: 'center' });
        y += 10;

        doc.setDrawColor(231, 76, 60);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

        const statsX = margin;
        const statsW = 80;

        doc.setFontSize(12);
        doc.setTextColor(52, 152, 219);
        doc.text('Statistics', statsX, y);
        y += 6;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        const stats = [
            ['Strikes', goodBalls],
            ['Balls', badBalls],
            ['Total Pitches', totalPitches],
            ['Strike Rate', goodBallRate + '%'],
            ['Strikeouts', strikeouts],
            ['Walks', walks],
            ['Hits', hits],
            ['Runs', runs]
        ];

        stats.forEach((s, i) => {
            if (i % 2 === 0) {
                doc.setFillColor(248, 248, 248);
                doc.rect(statsX, y - 3, statsW, 6, 'F');
            }
            doc.text(s[0], statsX + 3, y);
            const valColor = s[0] === 'Runs' ? [231, 76, 60] : [0, 0, 0];
            doc.setTextColor(...valColor);
            doc.text(String(s[1]), statsX + statsW - 3, y, { align: 'right' });
            doc.setTextColor(0, 0, 0);
            y += 6;
        });

        y += 3;
        doc.setFontSize(9);
        doc.setTextColor(46, 204, 113);
        doc.text(`Strike marks: ${spots.length}`, statsX, y);
        y += 5;
        doc.setTextColor(230, 126, 34);
        doc.text(`Ball marks: ${badSpots.length}`, statsX, y);
        y += 10;

        const imgX = margin + statsW + 10;
        const imgW = pageWidth - imgX - margin;
        const imgH = (canvas.height / canvas.width) * imgW;

        doc.setFontSize(12);
        doc.setTextColor(52, 152, 219);
        doc.text('Strike Zone', imgX, y);
        y += 4;

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Red box = Strike Zone | Blue = Ball Area', imgX, y);
        y += 2;

        const canvasData = canvas.toDataURL('image/png');
        doc.addImage(canvasData, 'PNG', imgX, y, imgW, imgH);
        y += imgH + 5;

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Generated by Pitcher Training Tracker', pageWidth / 2, 287, { align: 'center' });

        const fileName = `Training_Report_${trainingName}_${trainingDate}.pdf`;
        doc.save(fileName);

        closePreview();
    } catch (e) {
        console.error('PDF export error:', e);
        alert('PDF export failed. Please try again.');
    }
}

// ===== AI Analysis =====
function runAIAnalysis() {
    const goodBalls = parseInt(document.getElementById('goodBalls').value) || 0;
    const badBalls = parseInt(document.getElementById('badBalls').value) || 0;
    const totalPitches = parseInt(document.getElementById('totalPitches').value) || 0;
    const strikeouts = parseInt(document.getElementById('strikeouts').value) || 0;
    const walks = parseInt(document.getElementById('walks').value) || 0;
    const hits = parseInt(document.getElementById('hits').value) || 0;
    const runs = parseInt(document.getElementById('runs').value) || 0;
    const pitchType = document.getElementById('pitchType').value || 'N/A';
    const pitcherName = document.getElementById('pitcherName').value || 'Unknown Pitcher';

    if (totalPitches === 0 && spots.length === 0 && badSpots.length === 0) {
        alert('No training data yet. Please record some pitches first.');
        return;
    }

    // Analyze zone distribution (3x3 grid)
    const zoneData = analyzeZoneDistribution(spots, badSpots);

    // Generate AI report
    const report = generateAIReport({
        pitcherName,
        pitchType,
        goodBalls,
        badBalls,
        totalPitches,
        strikeouts,
        walks,
        hits,
        runs,
        zoneData,
        spots,
        badSpots
    });

    // Display in modal
    document.getElementById('aiModalContent').innerHTML = report;
    document.getElementById('aiModal').classList.add('active');
}

function analyzeZoneDistribution(strikeSpots, ballSpots) {
    // Define 3x3 zone boundaries
    const zoneLabels = [
        ['High-In', 'High-Mid', 'High-Out'],
        ['Mid-In', 'Mid-Center', 'Mid-Out'],
        ['Low-In', 'Low-Mid', 'Low-Out']
    ];

    // Initialize zone counts
    const zones = {
        strikes: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ],
        balls: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ]
    };

    // Analyze strike spots
    strikeSpots.forEach(spot => {
        const zone = getZone(spot, 'strike');
        if (zone) {
            zones.strikes[zone.row][zone.col]++;
        }
    });

    // Analyze ball spots
    ballSpots.forEach(spot => {
        const zone = getZone(spot, 'ball');
        if (zone) {
            zones.balls[zone.row][zone.col]++;
        }
    });

    return zones;
}

function getZone(spot, type) {
    // Normalize coordinates based on canvas size (450x580)
    const canvasW = 450, canvasH = 580;
    const largeZoneSize = Math.min(canvasW, canvasH) * 0.9;
    const largeZoneX = (canvasW - largeZoneSize) / 2;
    const largeZoneY = (canvasH - largeZoneSize) / 2;
    const strikeZoneWidth = largeZoneSize * (2 / 3);
    const strikeZoneHeight = largeZoneSize * (2 / 3);
    const strikeZoneX = (canvasW - strikeZoneWidth) / 2;
    const strikeZoneY = (canvasH - strikeZoneHeight) / 2;

    const cellW = strikeZoneWidth / 3;
    const cellH = strikeZoneHeight / 3;

    // Calculate normalized position
    const x = spot.x * (canvasW / (spot.x < 225 ? 450 : 450));
    const y = spot.y * (canvasH / (spot.y < 290 ? 580 : 580));

    // Determine row and col
    let col, row;

    if (type === 'strike') {
        // Inside strike zone
        if (x < strikeZoneX || x > strikeZoneX + strikeZoneWidth) return null;
        if (y < strikeZoneY || y > strikeZoneY + strikeZoneHeight) return null;

        col = Math.floor((x - strikeZoneX) / cellW);
        row = Math.floor((y - strikeZoneY) / cellH);
    } else {
        // Outside strike zone (ball zone) - relative to large zone
        if (x < largeZoneX || x > largeZoneX + largeZoneSize) return null;
        if (y < largeZoneY || y > largeZoneY + largeZoneSize) return null;

        col = Math.floor((x - largeZoneX) / (largeZoneSize / 3));
        row = Math.floor((y - largeZoneY) / (largeZoneSize / 3));
    }

    // Clamp values
    col = Math.max(0, Math.min(2, col));
    row = Math.max(0, Math.min(2, row));

    return { row, col };
}

function generateAIReport(data) {
    const { pitcherName, pitchType, goodBalls, badBalls, totalPitches, strikeouts, walks, hits, runs, zoneData, spots, badSpots } = data;

    // Calculate key metrics
    const strikeRate = totalPitches > 0 ? ((goodBalls / totalPitches) * 100).toFixed(1) : 0;
    const walkRate = totalPitches > 0 ? ((walks / totalPitches) * 100).toFixed(1) : 0;
    const kRate = totalPitches > 0 ? ((strikeouts / totalPitches) * 100).toFixed(1) : 0;
    const hitRate = totalPitches > 0 ? ((hits / totalPitches) * 100).toFixed(1) : 0;

    // Analyze zone preferences
    const zoneAnalysis = analyzeZonePreferences(zoneData, spots, badSpots);

    // Generate insights
    const insights = generateInsights({
        strikeRate, walkRate, kRate, hitRate,
        goodBalls, badBalls, strikeouts, walks, hits, runs,
        zoneData, zoneAnalysis, pitchType
    });

    // Build zone heatmap HTML
    const zoneHeatmap = buildZoneHeatmap(zoneData);

    // Build report HTML
    return `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <h3 style="margin: 0 0 5px 0;">${pitcherName}</h3>
                <p style="margin: 0; opacity: 0.9;">Pitch Type: ${pitchType}</p>
            </div>

            <!-- Key Metrics -->
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="value" style="color: #27ae60;">${strikeRate}%</div>
                    <div class="label">Strike Rate</div>
                </div>
                <div class="metric-card">
                    <div class="value" style="color: #e74c3c;">${kRate}%</div>
                    <div class="label">K Rate</div>
                </div>
                <div class="metric-card">
                    <div class="value" style="color: #f39c12;">${walkRate}%</div>
                    <div class="label">BB Rate</div>
                </div>
                <div class="metric-card">
                    <div class="value" style="color: #3498db;">${hitRate}%</div>
                    <div class="label">Hit Rate</div>
                </div>
            </div>

            <!-- Stats Summary -->
            <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; color: #2c3e50;">📊 Training Summary</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 14px;">
                    <div>Strikes: <strong>${goodBalls}</strong></div>
                    <div>Balls: <strong>${badBalls}</strong></div>
                    <div>Total: <strong>${totalPitches}</strong></div>
                    <div>K: <strong>${strikeouts}</strong></div>
                    <div>BB: <strong>${walks}</strong></div>
                    <div>H: <strong>${hits}</strong></div>
                </div>
            </div>

            <!-- Zone Heatmap -->
            <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; color: #2c3e50;">🎯 Strike Zone Heatmap</h4>
                <p style="font-size: 12px; color: #666; margin-bottom: 10px;">
                    <span style="color: #27ae60;">■</span> Green = Strikes (S) | <span style="color: #e67e22;">■</span> Orange = Balls (B)
                </p>
                <div style="display: flex; gap: 20px; align-items: flex-start;">
                    <div>
                        <div style="font-size: 11px; color: #666; margin-bottom: 3px;">STRIKE ZONE</div>
                        ${zoneHeatmap.strikeZone}
                    </div>
                    <div>
                        <div style="font-size: 11px; color: #666; margin-bottom: 3px;">BALL ZONE</div>
                        ${zoneHeatmap.ballZone}
                    </div>
                </div>
            </div>

            <!-- AI Insights -->
            <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0;">💡 AI Coach Insights</h4>
                ${insights.map(insight => `
                    <div style="background: rgba(255,255,255,0.15); padding: 10px; border-radius: 8px; margin-bottom: 8px;">
                        <strong>${insight.title}</strong>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">${insight.text}</p>
                    </div>
                `).join('')}
            </div>

            <!-- Recommendations -->
            <div style="background: #fff3cd; padding: 15px; border-radius: 10px; border-left: 4px solid #ffc107;">
                <h4 style="margin: 0 0 10px 0; color: #856404;">🎯 Training Recommendations</h4>
                <ul style="margin: 0; padding-left: 20px; color: #856404;">
                    ${generateRecommendations(data).map(rec => `<li style="margin-bottom: 5px;">${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

function analyzeZonePreferences(zoneData, strikeSpots, ballSpots) {
    const preferences = {
        favoriteZone: null,
        weakZone: null,
        highPitches: 0,
        lowPitches: 0,
        insidePitches: 0,
        outsidePitches: 0,
        strikeZoneControl: 0,
        totalMarked: strikeSpots.length + ballSpots.length
    };

    // Calculate totals per area
    let totalStrikes = 0, totalBalls = 0;
    let highZone = 0, midZone = 0, lowZone = 0;
    let insideZone = 0, outsideZone = 0;

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            totalStrikes += zoneData.strikes[r][c];
            totalBalls += zoneData.balls[r][c];

            // High/Mid/Low
            if (r === 0) highZone += zoneData.strikes[r][c];
            if (r === 1) midZone += zoneData.strikes[r][c];
            if (r === 2) lowZone += zoneData.strikes[r][c];

            // Inside/Outside (col 0 = inside, col 2 = outside)
            if (c === 0) insideZone += zoneData.strikes[r][c];
            if (c === 2) outsideZone += zoneData.strikes[r][c];
        }
    }

    preferences.highPitches = highZone;
    preferences.midPitches = midZone;
    preferences.lowPitches = lowZone;
    preferences.insidePitches = insideZone;
    preferences.outsidePitches = outsideZone;
    preferences.strikeZoneControl = totalStrikes;

    return preferences;
}

function generateInsights(data) {
    const insights = [];
    const { strikeRate, walkRate, kRate, hitRate, goodBalls, badBalls, zoneData, zoneAnalysis, pitchType } = data;

    // Strike Rate Analysis
    if (parseFloat(strikeRate) >= 65) {
        insights.push({
            title: '✅ Excellent Command',
            text: `Your strike rate of ${strikeRate}% is outstanding. You have exceptional pitch command and can work both sides of the plate effectively.`
        });
    } else if (parseFloat(strikeRate) >= 50) {
        insights.push({
            title: '⚠️ Average Command',
            text: `Your strike rate of ${strikeRate}% is acceptable. Focus on throwing more strikes early in the count to improve this to 60%+.`
        });
    } else {
        insights.push({
            title: '🔴 Command Needs Work',
            text: `A ${strikeRate}% strike rate is below average. Prioritize fastball command in future practices.`
        });
    }

    // K/BB Ratio Analysis
    const kbbRatio = parseFloat(walkRate) > 0 ? (parseFloat(kRate) / parseFloat(walkRate)).toFixed(2) : '∞';
    if (kbbRatio >= 2) {
        insights.push({
            title: '✅ Great K/BB Ratio',
            text: `Your K/BB ratio of ${kbbRatio} is excellent. You miss bats while limiting free passes effectively.`
        });
    } else if (kbbRatio >= 1) {
        insights.push({
            title: '⚠️ Average K/BB Ratio',
            text: `Your K/BB ratio of ${kbbRatio} could be improved. Try to get ahead in the count more often.`
        });
    }

    // Zone Distribution Analysis
    const totalStrikes = zoneAnalysis.strikeZoneControl;
    if (totalStrikes >= 15) {
        // Find most and least used zones
        let maxZone = { val: 0, row: 0, col: 0 };
        let minZone = { val: Infinity, row: 0, col: 0 };

        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (zoneData.strikes[r][c] > maxZone.val) {
                    maxZone = { val: zoneData.strikes[r][c], row: r, col: c };
                }
                if (zoneData.strikes[r][c] < minZone.val && zoneData.strikes[r][c] > 0) {
                    minZone = { val: zoneData.strikes[r][c], row: r, col: c };
                }
            }
        }

        const zoneNames = [
            ['High-Inside', 'High-Middle', 'High-Outside'],
            ['Mid-Inside', 'Heart', 'Mid-Outside'],
            ['Low-Inside', 'Low-Middle', 'Low-Outside']
        ];

        if (maxZone.val > 0) {
            insights.push({
                title: '🎯 Favorite Zone',
                text: `You favor the ${zoneNames[maxZone.row][maxZone.col]} zone (${maxZone.val} pitches). Hitters may start looking there.`
            });
        }
    }

    // Pitch Type Specific
    if (pitchType === 'Four-seam Fastball' || pitchType === 'Fastball') {
        insights.push({
            title: '🏃 Fastball Focus',
            text: 'For fastball pitchers: Work both sides of the plate and vary elevation. Stay aggressive after getting ahead 0-1 or 1-2.'
        });
    } else if (pitchType === 'Curveball') {
        insights.push({
            title: '🌀 Breaking Ball Focus',
            text: 'Breaking balls work best when thrown for strikes early, then used as putaway pitches. Watch your command in the dirt.'
        });
    } else if (pitchType === 'Changeup') {
        insights.push({
            title: '🔄 Changeup Focus',
            text: 'The changeup is most effective when it looks like a fastball out of your hand. Focus on similar arm action and release point.'
        });
    }

    return insights;
}

function generateRecommendations(data) {
    const recommendations = [];
    const { strikeRate, walkRate, kRate, goodBalls, badBalls, totalPitches, zoneData, pitchType } = data;

    // Strike rate recommendations
    if (parseFloat(strikeRate) < 50) {
        recommendations.push('Practice throwing strikes in bullpen sessions - aim for 70%+ strikes');
        recommendations.push('Focus on a consistent release point to improve accuracy');
    }

    // Walk rate recommendations
    if (parseFloat(walkRate) > 15) {
        recommendations.push('Work on pitch efficiency - get ahead of hitters early in counts');
        recommendations.push('Trust your stuff more - be aggressive with strikes when behind');
    }

    // Zone recommendations based on distribution
    const totalStrikes = zoneData.strikes.flat().reduce((a, b) => a + b, 0);

    if (totalStrikes > 0) {
        // Check for low zone usage
        const lowStrikes = zoneData.strikes[2].reduce((a, b) => a + b, 0);
        if (lowStrikes < totalStrikes * 0.2) {
            recommendations.push('Add more low pitches - hitters struggle with low strikes, especially in 2-strike counts');
        }

        // Check for high zone usage
        const highStrikes = zoneData.strikes[0].reduce((a, b) => a + b, 0);
        if (highStrikes > totalStrikes * 0.5) {
            recommendations.push('Balance your elevation - mix in more low and middle pitches to keep hitters off balance');
        }
    }

    // General recommendations
    if (parseFloat(kRate) < 10) {
        recommendations.push('Work on a putaway pitch - practice finishing hitters with your best secondary offering');
        recommendations.push('Attack hitters aggressively in hitter\'s counts - don\'t give in to free bases');
    }

    // Pitch type specific
    recommendations.push('Film your sessions to analyze mechanics and identify patterns');

    // Always include one positive
    if (parseFloat(strikeRate) >= 60) {
        recommendations.push('Great command! Focus on pitch sequencing and locating on the edges of the zone');
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
}

function buildZoneHeatmap(zoneData) {
    const zoneLabels = [
        ['High-In', 'High-Mid', 'High-Out'],
        ['Mid-In', 'Mid-Center', 'Mid-Out'],
        ['Low-In', 'Low-Mid', 'Low-Out']
    ];

    const getColor = (count, maxCount) => {
        if (count === 0) return '#f0f0f0';
        const intensity = Math.min(count / (maxCount || 5), 1);
        return `rgba(46, 204, 113, ${0.2 + intensity * 0.8})`;
    };

    const getBallColor = (count, maxCount) => {
        if (count === 0) return '#f0f0f0';
        const intensity = Math.min(count / (maxCount || 5), 1);
        return `rgba(230, 126, 34, ${0.2 + intensity * 0.8})`;
    };

    // Find max values
    let maxStrike = 0, maxBall = 0;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            maxStrike = Math.max(maxStrike, zoneData.strikes[r][c]);
            maxBall = Math.max(maxBall, zoneData.balls[r][c]);
        }
    }

    // Build strike zone grid
    let strikeZoneHTML = '<div style="display: grid; grid-template-columns: repeat(3, 50px); grid-template-rows: repeat(3, 40px); gap: 2px;">';
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const count = zoneData.strikes[r][c];
            const label = zoneLabels[r][c];
            const bgColor = getColor(count, maxStrike);
            const textColor = count > 0 ? 'white' : '#999';
            strikeZoneHTML += `<div style="background: ${bgColor}; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; color: ${textColor};">
                <span style="font-weight: bold;">S:${count}</span>
            </div>`;
        }
    }
    strikeZoneHTML += '</div>';

    // Build ball zone grid
    let ballZoneHTML = '<div style="display: grid; grid-template-columns: repeat(3, 40px); grid-template-rows: repeat(3, 35px); gap: 2px;">';
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const count = zoneData.balls[r][c];
            const bgColor = getBallColor(count, maxBall);
            const textColor = count > 0 ? 'white' : '#999';
            ballZoneHTML += `<div style="background: ${bgColor}; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; color: ${textColor};">
                <span style="font-weight: bold;">B:${count}</span>
            </div>`;
        }
    }
    ballZoneHTML += '</div>';

    return { strikeZone: strikeZoneHTML, ballZone: ballZoneHTML };
}

function closeAiModal() {
    document.getElementById('aiModal').classList.remove('active');
}

