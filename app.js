/**
 * 棒垒球投手训练记录 - 核心逻辑
 */

// ===== 全局状态 =====
let markedSpots = [];  // 存储标记的球位置
let spots = [];        // Canvas上的标记点（好球）
let badSpots = [];     // 坏球位置
let currentMode = 'good'; // 当前模式：'good' 好球, 'bad' 坏球

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    // 设置默认日期为今天
    document.getElementById('trainingDate').valueAsDate = new Date();
    
    // 绘制九宫格
    drawStrikeZone();
    
    // 绑定事件
    setupEventListeners();
    
    // 初始化统计
    updateStats();
});

// ===== 绘制九宫格进垒区（缩小版 + 坏球外围区）=====
function drawStrikeZone() {
    // 清空画布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 好球区在中心位置
    const zoneSize = Math.min(canvas.width, canvas.height) * 0.55; // 好球区占55%
    const zoneX = (canvas.width - zoneSize) / 2;
    const zoneY = (canvas.height - zoneSize) / 2;
    const cellW = zoneSize / 3;
    const cellH = zoneSize / 3;
    
    // 绘制坏球外围区域（半透明灰色）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 好球区背景
    ctx.fillStyle = 'rgba(46, 204, 113, 0.1)';
    ctx.fillRect(zoneX, zoneY, zoneSize, zoneSize);
    
    // 绘制网格线（好球区）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    
    // 横线
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(zoneX, zoneY + i * cellH);
        ctx.lineTo(zoneX + zoneSize, zoneY + i * cellH);
        ctx.stroke();
    }
    
    // 竖线
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(zoneX + i * cellW, zoneY);
        ctx.lineTo(zoneX + i * cellW, zoneY + zoneSize);
        ctx.stroke();
    }
    
    // 好球区边框（红色粗线）
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.strokeRect(zoneX, zoneY, zoneSize, zoneSize);
    
    // 好球区标签（小字）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    
    const labels = [
        ['高内', '高正', '高外'],
        ['中内', '好球区', '中外'],
        ['低内', '低正', '低外']
    ];
    
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const x = zoneX + col * cellW + cellW / 2;
            const y = zoneY + row * cellH + cellH / 2;
            ctx.fillText(labels[row][col], x, y + 4);
        }
    }
    
    // 坏球区外围标签
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.font = '10px Arial';
    
    // 顶部标签
    ctx.fillText('坏球区（高）', canvas.width / 2, zoneY - 15);
    // 底部标签
    ctx.fillText('坏球区（低）', canvas.width / 2, zoneY + zoneSize + 20);
    // 左侧标签
    ctx.fillText('外', zoneX - 20, canvas.height / 2);
    // 右侧标签
    ctx.fillText('内', zoneX + zoneSize + 20, canvas.height / 2);
    
    // 重新绘制已保存的点
    // 好球（绿色）
    spots.forEach((spot, index) => {
        drawSpot(spot.x, spot.y, '#2ecc71', index + 1); // 绿色
    });
    
    // 坏球（橙色）
    badSpots.forEach((spot, index) => {
        drawSpot(spot.x, spot.y, '#e67e22', spots.length + index + 1); // 橙色
    });
}

// ===== 绘制单个标记点 =====
function drawSpot(x, y, color = '#ff69b4', number = 1) {
    // 圆点
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    // 白色边框
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 编号
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(number.toString(), x, y + 4);
}

// ===== 处理画布点击 =====
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const newSpot = { x, y };
    
    if (currentMode === 'good') {
        spots.push(newSpot);
        markedSpots.push({ ...newSpot, type: 'good' });
    } else {
        badSpots.push(newSpot);
        markedSpots.push({ ...newSpot, type: 'bad' });
    }
    
    // 重绘
    drawStrikeZone();
    updateStats();
});

// ===== 绑定事件监听 =====
function setupEventListeners() {
    // 好球/坏球 +/- 按钮
    document.querySelectorAll('.btn-plus').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = document.getElementById(btn.dataset.target);
            target.value = parseInt(target.value || 0) + 1;
            updateStats();
        });
    });
    
    document.querySelectorAll('.btn-minus').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = document.getElementById(btn.dataset.target);
            target.value = Math.max(0, parseInt(target.value || 0) - 1);
            updateStats();
        });
    });
    
    // 直接输入时也更新统计
    ['goodBalls', 'badBalls', 'strikeouts', 'hits', 'runs'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateStats);
    });
    
    // 清空打点按钮
    document.getElementById('clearSpots').addEventListener('click', () => {
        spots = [];
        badSpots = [];
        markedSpots = [];
        drawStrikeZone();
        updateStats();
    });
    
    // 重置所有数据
    document.getElementById('resetAll').addEventListener('click', () => {
        if (confirm('确定要重置所有数据吗？')) {
            // 重置表单
            document.getElementById('goodBalls').value = 0;
            document.getElementById('badBalls').value = 0;
            document.getElementById('strikeouts').value = 0;
            document.getElementById('hits').value = 0;
            document.getElementById('runs').value = 0;
            document.getElementById('pitcherName').value = '';
            document.getElementById('trainingName').value = '';
            document.getElementById('pitchType').value = '';
            
            // 清空打点
            spots = [];
            badSpots = [];
            markedSpots = [];
            drawStrikeZone();
            updateStats();
        }
    });
    
    // 导出 PDF 按钮
    document.getElementById('exportPDF').addEventListener('click', showPreview);
    
    // 预览模态框按钮
    document.getElementById('cancelPreview').addEventListener('click', closePreview);
    document.getElementById('downloadPDF').addEventListener('click', exportToPDF);
    
    // 点击模态框外部关闭
    document.getElementById('previewModal').addEventListener('click', (e) => {
        if (e.target.id === 'previewModal') closePreview();
    });
}

// ===== 模式切换函数 =====
function setMode(mode) {
    currentMode = mode;
    
    // 更新按钮样式
    const btnGood = document.getElementById('btnGoodMode');
    const btnBad = document.getElementById('btnBadMode');
    
    if (mode === 'good') {
        btnGood.classList.add('active', 'good');
        btnBad.classList.remove('active', 'bad');
        document.getElementById('modeHint').textContent = '点击下方区域标记好球位置（绿色点）';
    } else {
        btnBad.classList.add('active', 'bad');
        btnGood.classList.remove('active', 'good');
        document.getElementById('modeHint').textContent = '点击下方区域标记坏球位置（橙色点）';
    }
}

// ===== 更新统计数据 =====
function updateStats() {
    const goodBalls = parseInt(document.getElementById('goodBalls').value) || 0;
    const badBalls = parseInt(document.getElementById('badBalls').value) || 0;
    const strikeouts = parseInt(document.getElementById('strikeouts').value) || 0;
    const hits = parseInt(document.getElementById('hits').value) || 0;
    const runs = parseInt(document.getElementById('runs').value) || 0;
    
    const totalPitches = goodBalls + badBalls;
    const goodBallRate = totalPitches > 0 ? ((goodBalls / totalPitches) * 100).toFixed(1) : 0;
    
    document.getElementById('totalPitches').textContent = totalPitches;
    document.getElementById('goodBallRate').textContent = goodBallRate + '%';
    document.getElementById('statStrikeouts').textContent = strikeouts;
    document.getElementById('statHits').textContent = hits;
    document.getElementById('statRuns').textContent = runs;
    document.getElementById('markedPitches').textContent = `${spots.length}好/${badSpots.length}坏`;
}

// ===== 显示预览 =====
function showPreview() {
    const modal = document.getElementById('previewModal');
    const preview = document.getElementById('pdfPreview');
    
    // 获取数据
    const pitcherName = document.getElementById('pitcherName').value || '未填写';
    const trainingName = document.getElementById('trainingName').value || '训练记录';
    const pitchType = document.getElementById('pitchType').value || '未指定';
    const trainingDate = document.getElementById('trainingDate').value || new Date().toISOString().split('T')[0];
    
    const goodBalls = parseInt(document.getElementById('goodBalls').value) || 0;
    const badBalls = parseInt(document.getElementById('badBalls').value) || 0;
    const strikeouts = parseInt(document.getElementById('strikeouts').value) || 0;
    const hits = parseInt(document.getElementById('hits').value) || 0;
    const totalPitches = goodBalls + badBalls;
    const goodBallRate = totalPitches > 0 ? ((goodBalls / totalPitches) * 100).toFixed(1) : 0;
    
    // 生成预览 HTML
    preview.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h1 style="text-align: center; color: #e74c3c; margin-bottom: 10px;">⚾ 投手训练报告</h1>
            <h2 style="text-align: center; margin-bottom: 20px;">${trainingName}</h2>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px;">
                <span>投手：${pitcherName}</span>
                <span>日期：${trainingDate}</span>
                <span>类型：${pitchType}</span>
            </div>
            
            <div style="border: 2px solid #333; padding: 15px; margin-bottom: 20px;">
                <h3 style="margin-bottom: 10px;">📊 投球统计</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 8px;">好球数</td>
                        <td style="padding: 8px; font-weight: bold; text-align: right;">${goodBalls}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 8px;">坏球数</td>
                        <td style="padding: 8px; font-weight: bold; text-align: right;">${badBalls}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 8px;">总投球数</td>
                        <td style="padding: 8px; font-weight: bold; text-align: right;">${totalPitches}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 8px;">好球率</td>
                        <td style="padding: 8px; font-weight: bold; text-align: right; color: #27ae60;">${goodBallRate}%</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 8px;">三振次数</td>
                        <td style="padding: 8px; font-weight: bold; text-align: right;">${strikeouts}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 8px;">安打数</td>
                        <td style="padding: 8px; font-weight: bold; text-align: right;">${hits}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;">失分数</td>
                        <td style="padding: 8px; font-weight: bold; text-align: right; color: #e74c3c;">${runs}</td>
                    </tr>
                </table>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px;">
                九宫格进垒区标记：${spots.length} 好球 / ${badSpots.length} 坏球
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// ===== 关闭预览 =====
function closePreview() {
    document.getElementById('previewModal').classList.remove('active');
}

// ===== 导出 PDF =====
async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    
    // 获取数据
    const pitcherName = document.getElementById('pitcherName').value || '未填写';
    const trainingName = document.getElementById('trainingName').value || '训练记录';
    const pitchType = document.getElementById('pitchType').value || '未指定';
    const trainingDate = document.getElementById('trainingDate').value || new Date().toISOString().split('T')[0];
    
    const goodBalls = parseInt(document.getElementById('goodBalls').value) || 0;
    const badBalls = parseInt(document.getElementById('badBalls').value) || 0;
    const strikeouts = parseInt(document.getElementById('strikeouts').value) || 0;
    const hits = parseInt(document.getElementById('hits').value) || 0;
    const runs = parseInt(document.getElementById('runs').value) || 0;
    const totalPitches = goodBalls + badBalls;
    const goodBallRate = totalPitches > 0 ? ((goodBalls / totalPitches) * 100).toFixed(1) : 0;
    
    let yPos = margin;
    
    // 标题
    doc.setFontSize(20);
    doc.setTextColor(231, 76, 60);
    doc.text('投手训练报告', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // 训练名称
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(trainingName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;
    
    // 基本信息
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`投手：${pitcherName}  |  日期：${trainingDate}  |  类型：${pitchType}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    // 分隔线
    doc.setDrawColor(231, 76, 60);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    
    // 统计表格标题
    doc.setFontSize(14);
    doc.setTextColor(52, 152, 219);
    doc.text('投球统计', margin, yPos);
    yPos += 8;
    
    // 统计数据
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    
    const stats = [
        ['好球数', goodBalls.toString()],
        ['坏球数', badBalls.toString()],
        ['总投球数', totalPitches.toString()],
        ['好球率', goodBallRate + '%'],
        ['三振次数', strikeouts.toString()],
        ['安打数', hits.toString()],
        ['失分数', runs.toString()]
    ];
    
    stats.forEach((stat, i) => {
        doc.setFillColor(i % 2 === 0 ? 245 : 255, i % 2 === 0 ? 245 : 255, i % 2 === 0 ? 245 : 255);
        doc.rect(margin, yPos - 4, pageWidth - margin * 2, 8, 'F');
        doc.text(stat[0], margin + 5, yPos);
        // 失分数用红色高亮
        if (stat[0] === '失分数') {
            doc.setTextColor(231, 76, 60);
            doc.text(stat[1], pageWidth - margin - 5, yPos, { align: 'right' });
            doc.setTextColor(0, 0, 0);
        } else {
            doc.text(stat[1], pageWidth - margin - 5, yPos, { align: 'right' });
        }
        yPos += 8;
    });
    
    yPos += 10;
    
    // 九宫格进垒区标题
    doc.setFontSize(14);
    doc.setTextColor(52, 152, 219);
    doc.text('九宫格进垒区分布图', margin, yPos);
    yPos += 8;
    
    // 说明文字
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`好球：${spots.length} 个（绿色）| 坏球：${badSpots.length} 个（橙色）`, margin, yPos);
    yPos += 6;
    
    // 将 Canvas 转换为图片并添加到 PDF（确保九宫格图完整导出）
    const canvasData = canvas.toDataURL('image/png');
    const imgWidth = 90;  // 稍微放大一点
    const imgHeight = (canvas.height / canvas.width) * imgWidth;
    
    // 确保图在页面范围内
    const maxImgHeight = pageHeight - yPos - 15;
    const finalHeight = Math.min(imgHeight, maxImgHeight);
    const finalWidth = (finalHeight / imgHeight) * imgWidth;
    const imgX = (pageWidth - finalWidth) / 2;
    
    // 绘制九宫格图片
    doc.addImage(canvasData, 'PNG', imgX, yPos, finalWidth, finalHeight);
    yPos += finalHeight + 5;
    
    // 底部信息
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by 投手训练记录系统', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // 下载 PDF
    const fileName = `训练报告_${trainingName}_${trainingDate}.pdf`;
    doc.save(fileName);
    
    closePreview();
}