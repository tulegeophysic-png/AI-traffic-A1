// counting.js - Xử lý hiển thị trực quan bounding box, ID, vạch đếm và phân làn lên Canvas

import { ctx, canvas } from './main.js';

/**
 * Vẽ khung bao quanh xe, ID, tên loại xe và vạch đếm lên màn hình
 */
export function drawScene(trackedDetections) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Vẽ vạch đếm ngang và vạch phân định dọc (Làn Trái / Làn Phải)
    const midX = canvas.width / 2;
    const midY = canvas.height / 2;

    // Vạch dọc phân định Trái - Phải
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(midX, 0);
    ctx.lineTo(midX, canvas.height);
    ctx.stroke();

    // Vạch ngang đếm xe
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(canvas.width, midY);
    ctx.stroke();
    ctx.setLineDash([]); // Reset nét vẽ

    // Chú thích vạch trên màn hình
    ctx.fillStyle = '#00ff00';
    ctx.font = '14px Arial';
    ctx.fillText("LÀN TRÁI", midX - 100, 30);
    ctx.fillText("LÀN PHẢI", midX + 30, 30);

    // 2. Vẽ bounding box và thông tin của từng xe đang tracking
    if (!trackedDetections) return;

    trackedDetections.forEach(veh => {
        const { x1, y1, x2, y2, class: cls, id, lane } = veh;

        // Màu sắc phân biệt tùy theo làn (Làn Trái: Xanh dương, Làn Phải: Xanh lá)
        const strokeColor = lane === 'left' ? '#3b82f6' : '#10b981';

        // Vẽ khung Bounding Box
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

        // Nền chữ
        const label = `#${id} ${cls.toUpperCase()} (${lane.toUpperCase()})`;
        ctx.font = '12px Arial';
        const textWidth = ctx.measureText(label).width;
        
        ctx.fillStyle = strokeColor;
        ctx.fillRect(x1, y1 - 20, textWidth + 10, 20);

        // Chữ hiển thị
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, x1 + 5, y1 - 6);
    });
}