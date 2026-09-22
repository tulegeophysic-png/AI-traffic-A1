// dashboard.js - Quản lý cập nhật giao diện thống kê Trái - Phải - Tổng

import { vehicleStats } from './tracking.js';

/**
 * Cập nhật số liệu từ biến vehicleStats ra bảng HTML tương ứng
 */
export function updateUIStats() {
    // Cập nhật số liệu cho ô Car (Ô tô)
    document.getElementById('car-left').innerText = vehicleStats.car.left;
    document.getElementById('car-right').innerText = vehicleStats.car.right;
    document.getElementById('car-total').innerText = vehicleStats.car.total;

    // Cập nhật số liệu cho ô Motorcycle (Xe máy)
    document.getElementById('moto-left').innerText = vehicleStats.motorcycle.left;
    document.getElementById('moto-right').innerText = vehicleStats.motorcycle.right;
    document.getElementById('moto-total').innerText = vehicleStats.motorcycle.total;

    // Cập nhật số liệu cho ô Bus (Xe buýt)
    document.getElementById('bus-left').innerText = vehicleStats.bus.left;
    document.getElementById('bus-right').innerText = vehicleStats.bus.right;
    document.getElementById('bus-total').innerText = vehicleStats.bus.total;

    // Cập nhật số liệu cho ô Truck (Xe tải)
    document.getElementById('truck-left').innerText = vehicleStats.truck.left;
    document.getElementById('truck-right').innerText = vehicleStats.truck.right;
    document.getElementById('truck-total').innerText = vehicleStats.truck.total;
}

export function setStatus(statusClass, statusText) {
    const statusBadge = document.getElementById('ai-status-badge');
    if (statusBadge) {
        statusBadge.className = `status-badge ${statusClass}`;
        statusBadge.innerText = statusText;
    }
}