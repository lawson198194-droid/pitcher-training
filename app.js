/**
 * 棒垒球投手训练记录 - 核心逻辑
 */

// ===== 全局状态 =====
let spots = [];        // 好球位置（在小九宫格内）
let badSpots = [];     // 坏球位置（在大九宫格但不在小九宫格内）

// ===== 尺寸变量（供点击判断用）=====
let strikeZoneX, strikeZoneY, strikeZoneWidth, strikeZoneHeight;
let largeZoneX, largeZoneY, largeZoneSize;

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

// ===== 绘制九宫格进垒区（双层结构：大九宫格 + 小九宫格）=====
function drawStrikeZone() {
    // 清空画布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 计算尺寸
    // 大九宫格占画布的 90%
    largeZoneSize = Math.min(canvas.width, canvas.height) * 0.9;
    largeZoneX = (canvas.width - largeZoneSize) / 2;
    largeZoneY = (canvas.height - largeZoneSize) / 2;
    
    // 小九宫格是大九宫格的 2/3
    strikeZoneWidth = largeZoneSize * (2 / 3);
    strikeZoneHeight = largeZoneSize * (2 / 3);
    strikeZoneX = (canvas.width - strikeZoneWidth) / 2;
    strikeZoneY = (canvas.height - strikeZoneHeight) / 2;
    
    // 保持向后兼容
    const smallZoneX = strikeZoneX;
    const smallZoneY = strikeZoneY;
    const smallZoneSize = strikeZoneWidth;
    
    const smallCellW = smallZoneSize / 3;
    const smallCellH = smallZoneSize / 3;
    
    // 绘制大九宫格的网格线（半透明，不显示边框）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    
    // 大九宫格的横线
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(largeZoneX, largeZoneY + i * (largeZoneSize / 3));
        ctx.lineTo(largeZoneX + largeZoneSize, largeZoneY + i * (largeZoneSize / 3));
        ctx.stroke();
    }
    
    // 大九宫格的竖线
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(largeZoneX + i * (largeZoneSize / 3), largeZoneY);
        ctx.lineTo(largeZoneX + i * (largeZoneSize / 3), largeZoneY + largeZoneSize);
        ctx.stroke();
    }
    
    // 绘制小九宫格区域（好球区背景）
    ctx.fillStyle = 'rgba(46, 204, 113, 0.15)';
    ctx.fillRect(smallZoneX, smallZoneY, smallZoneSize, smallZoneSize);
    
    // 绘制小九宫格的网格线（实线）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    
    // 小九宫格的横线
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(smallZoneX, smallZoneY + i * smallCellH);
        ctx.lineTo(smallZoneX + smallZoneSize, smallZoneY + i * smallCellH);
        ctx.stroke();
    }
    
    // 小九宫格的竖线
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(smallZoneX + i * smallCellW, smallZoneY);
        ctx.lineTo(smallZoneX + i * smallCellW, smallZoneY + smallZoneSize);
        ctx.stroke();
    }
    
    // 小九宫格边框（红色粗线 - 好球区）
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.strokeRect(smallZoneX, smallZoneY, smallZoneSize, smallZoneSize);
    
    // 大九宫格边框（白色虚线 - 仅供参考，不计入）
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(largeZoneX, largeZoneY, largeZoneSize, largeZoneSize);
    ctx.setLineDash([]);
    
    // 小九宫格标签
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    
    const labels = [
        ['高内', '高中', '高外'],
        ['中内', '好球区', '中外'],
        ['低内', '低中', '低外']
    ];
    
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const x = smallZoneX + col * smallCellW + smallCellW / 2;
            const y = smallZoneY + row * smallCellH + smallCellH / 2;
            ctx.fillText(labels[row][col], x, y + 4);
        }
    }
    
    // 图例说明
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('红框内 = 好球区（2/3尺寸）', 10, canvas.height - 15);
    ctx.textAlign = 'right';
    ctx.fillText('虚线内 = 大参考区', canvas.width - 10, canvas.height - 15);
    
    // 重新绘制已保存的点
    // 好球（绿色）
    spots.forEach((spot, index) => {
        drawSpot(spot.x, spot.y, '#2ecc71', index + 1);
    });
    
    // 坏球（橙色）
    badSpots.forEach((spot, index) => {
        drawSpot(spot.x, spot.y, '#e67e22', spots.length + index + 1);
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
    
    // 判断是否在大九宫格内（只在区域内响应点击）
    const isInLargeZone = x >= largeZoneX && 
                          x <= largeZoneX + largeZoneSize &&
                          y >= largeZoneY && 
                          y <= largeZoneY + largeZoneSize;
    
    if (!isInLargeZone) return; // 点击在大九宫格外，忽略
    
    // 判断是否在小九宫格内（好球区）
    const isInStrikeZone = x >= strikeZoneX && 
                          x <= strikeZoneX + strikeZoneWidth &&
                          y >= strikeZoneY && 
                          y <= strikeZoneY + strikeZoneHeight;
    
    if (isInStrikeZone) {
        // 在好球区内 → 绿色点
        spots.push(newSpot);
    } else {
        // 在大九宫格但不在小九宫格内 → 橙色点（坏球）
        badSpots.push(newSpot);
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
    const runs = parseInt(document.getElementById('runs').value) || 0;
    const totalPitches = goodBalls + badBalls;
    const goodBallRate = totalPitches > 0 ? ((goodBalls / totalPitches) * 100).toFixed(1) : 0;
    
    // 将 Canvas 转换为图片
    const canvasData = canvas.toDataURL('image/png');
    
    // 生成预览 HTML（包含九宫格图）
    preview.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h1 style="text-align: center; color: #e74c3c; margin-bottom: 10px;">⚾ 投手训练报告</h1>
            <h2 style="text-align: center; margin-bottom: 15px;">${trainingName}</h2>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 12px; color: #666;">
                <span>投手：${pitcherName}</span>
                <span>日期：${trainingDate}</span>
                <span>类型：${pitchType}</span>
            </div>
            
            <div style="display: flex; gap: 20px;">
                <!-- 左侧：统计表 -->
                <div style="flex: 1;">
                    <div style="border: 2px solid #333; padding: 12px;">
                        <h3 style="margin-bottom: 10px; color: #e74c3c;">📊 投球统计</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 6px;">好球数</td>
                                <td style="padding: 6px; font-weight: bold; text-align: right;">${goodBalls}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 6px;">坏球数</td>
                                <td style="padding: 6px; font-weight: bold; text-align: right;">${badBalls}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 6px;">总投球数</td>
                                <td style="padding: 6px; font-weight: bold; text-align: right;">${totalPitches}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 6px;">好球率</td>
                                <td style="padding: 6px; font-weight: bold; text-align: right; color: #27ae60;">${goodBallRate}%</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 6px;">三振次数</td>
                                <td style="padding: 6px; font-weight: bold; text-align: right;">${strikeouts}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 6px;">安打数</td>
                                <td style="padding: 6px; font-weight: bold; text-align: right;">${hits}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px;">失分数</td>
                                <td style="padding: 6px; font-weight: bold; text-align: right; color: #e74c3c;">${runs}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="margin-top: 15px; text-align: center; color: #666; font-size: 12px;">
                        <span style="color: #27ae60;">●</span> 好球：${spots.length}个
                        <span style="color: #e67e22; margin-left: 10px;">●</span> 坏球：${badSpots.length}个
                    </div>
                </div>
                
                <!-- 右侧：九宫格图 -->
                <div style="flex: 0 0 200px;">
                    <h3 style="margin-bottom: 8px; color: #e74c3c; text-align: center;">🎯 进垒区分布</h3>
                    <img src="${canvasData}" style="width: 100%; border: 1px solid #ddd; border-radius: 8px;" />
                    <div style="font-size: 10px; color: #999; text-align: center; margin-top: 5px;">
                        红框=好球区(2/3) | 虚线=大参考区
                    </div>
                </div>
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
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(trainingName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    // 基本信息
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`投手：${pitcherName}  |  日期：${trainingDate}  |  类型：${pitchType}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // 分隔线
    doc.setDrawColor(231, 76, 60);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    // 将 Canvas 转换为图片
    const canvasData = canvas.toDataURL('image/png');
    
    // ===== 左侧：统计表 =====
    const statsX = margin;
    const statsWidth = 80;
    
    doc.setFontSize(12);
    doc.setTextColor(52, 152, 219);
    doc.text('投球统计', statsX, yPos);
    yPos += 6;
    
    // 统计数据
    doc.setFontSize(10);
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
        doc.rect(statsX, yPos - 3, statsWidth, 6, 'F');
        doc.text(stat[0], statsX + 3, yPos);
        // 失分数用红色高亮
        if (stat[0] === '失分数') {
            doc.setTextColor(231, 76, 60);
            doc.text(stat[1], statsX + statsWidth - 3, yPos, { align: 'right' });
            doc.setTextColor(0, 0, 0);
        } else {
            doc.text(stat[1], statsX + statsWidth - 3, yPos, { align: 'right' });
        }
        yPos += 6;
    });
    
    // 好球/坏球标记数
    yPos += 4;
    doc.setFontSize(9);
    doc.setTextColor(46, 204, 113);
    doc.text(`● 好球标记: ${spots.length}个`, statsX, yPos);
    yPos += 5;
    doc.setTextColor(230, 126, 34);
    doc.text(`● 坏球标记: ${badSpots.length}个`, statsX, yPos);
    yPos += 10;
    
    // ===== 右侧：九宫格图 =====
    const imgX = margin + statsWidth + 10;
    const imgWidth = pageWidth - imgX - margin;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;
    
    // 九宫格图标题
    doc.setFontSize(12);
    doc.setTextColor(52, 152, 219);
    doc.text('进垒区分布图', imgX, yPos);
    yPos += 4;
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('红框=好球区(2/3尺寸) | 虚线=大参考区', imgX, yPos);
    yPos += 2;
    
    // 绘制九宫格图片
    doc.addImage(canvasData, 'PNG', imgX, yPos, imgWidth, imgHeight);
    yPos += imgHeight + 5;
    
    // 底部信息
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by 投手训练记录系统', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // 下载 PDF
    const fileName = `训练报告_${trainingName}_${trainingDate}.pdf`;
    doc.save(fileName);
    
    closePreview();
}