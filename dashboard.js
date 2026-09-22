// dashboard.js - Quản lý giao diện bảng điều khiển, thống kê đếm xe và xuất dữ liệu

import { vehicleStats, resetVehicleStats } from './tracking.js';

/**
 * Cập nhật số liệu thống kê lên các thành phần giao diện (UI) theo thời gian thực
 */
export function updateUIStats() {
    let totalCars = vehicleStats.car.total;
    let totalMotorcycles = vehicleStats.motorcycle.total;
    let totalBuses = vehicleStats.bus.total;
    let totalTrucks = vehicleStats.truck.total;

    // Lấy các phần tử hiển thị trên HTML (có thể tùy chỉnh lại id nếu HTML của bạn khác)
    const elCar = document.getElementById('stat-car');
    const elMotorcycle = document.getElementById('stat-motorcycle');
    const elBus = document.getElementById('stat-bus');
    const elTruck = document.getElementById('stat-truck');
    const elTotal = document.getElementById('stat-total');

    if (elCar) elCar.innerText = totalCars;
    if (elMotorcycle) elMotorcycle.innerText = totalMotorcycles;
    if (elBus) elBus.innerText = totalBuses;
    if (elTruck) elTruck.innerText = totalTrucks;
    if (elTotal) elTotal.innerText = totalCars + totalMotorcycles + totalBuses + totalTrucks;

    // Cập nhật chi tiết theo từng làn nếu giao diện có hỗ trợ
    updateLaneStats('car', vehicleStats.car);
    updateLaneStats('motorcycle', vehicleStats.motorcycle);
    updateLaneStats('bus', vehicleStats.bus);
    updateLaneStats('truck', vehicleStats.truck);
}

/**
 * Cập nhật chi tiết số lượng theo Làn Trái / Làn Phải cho từng loại xe
 */
function updateLaneStats(type, stats) {
    const elLeft = document.getElementById(`stat-${type}-left`);
    const elRight = document.getElementById(`stat-${type}-right`);

    if (elLeft) elLeft.innerText = stats.left;
    if (elRight) elRight.innerText = stats.right;
}

/**
 * Thay đổi trạng thái hiển thị của Badge trên giao diện (Ví dụ: READY, RUNNING, STOPPED, ERROR)
 */
export function setStatus(type, message) {
    const statusBadge = document.getElementById('status-badge');
    if (!statusBadge) return;
    statusBadge.innerText = message;
    
    // Gán class CSS tương ứng (ready, running, stopped, error)
    statusBadge.className = `badge ${type}`;
}

/**
 * Xuất toàn bộ dữ liệu thống kê đếm xe ra file Excel (định dạng CSV hỗ trợ tiếng Việt UTF-8)
 */
export function exportToExcel() {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Loại phương tiện,Làn Trái,Làn Phải,Tổng cộng\n";
    
    for (let key in vehicleStats) {
        const item = vehicleStats[key];
        csvContent += `${key.toUpperCase()},${item.left},${item.right},${item.total}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `traffic_statistics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Khởi tạo sự kiện gắn kết các nút bấm trên Dashboard (nếu cần thiết)
 */
export function initDashboardEvents() {
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            resetVehicleStats();
            updateUIStats();
        });
    }

    const btnExport = document.getElementById('btn-export');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            exportToExcel();
        });
    }
}