// main.js - File trung tâm khởi chạy ứng dụng AI Giám sát Giao thông

import { updateUIStats, setStatus, initDashboardEvents, exportToExcel } from './dashboard.js';
import { startAI, stopAI, captureFrame, setupLiveCamera } from './video.js';

// Khai báo các biến toàn cục cho Canvas và AI Session
export let canvas, ctx;
export let inferenceCanvas, inferenceCtx;
export let latestDetections = [];
let running = false;
let inferencing = false;

// Các hàm getter/setter trạng thái hệ thống
export function isRunning() { return running; }
export function setRunning(val) { running = val; }

export function isInferencing() { return inferencing; }
export function setInferencing(val) { inferencing = val; }

export function setLatestDetections(dets) { latestDetections = dets; }

/**
 * Khởi tạo ứng dụng khi trang web được tải xong
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Khởi tạo Canvas hiển thị chính
    canvas = document.getElementById('output-canvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
    }

    // 2. Khởi tạo Canvas phụ chuyên dùng cho AI suy luận (Inference)
    inferenceCanvas = document.createElement('canvas');
    inferenceCtx = inferenceCanvas.getContext('2d');

    // 3. Khởi tạo các sự kiện giao diện nút bấm
    initDashboardEvents();

    // Gắn sự kiện cho nút Chạy AI
    const btnStart = document.getElementById('btn-start');
    if (btnStart) {
        btnStart.addEventListener('click', () => {
            startAI();
        });
    }

    // Gắn sự kiện cho nút Dừng lại
    const btnStop = document.getElementById('btn-stop');
    if (btnStop) {
        btnStop.addEventListener('click', () => {
            stopAI();
        });
    }

    // Gắn sự kiện cho nút Chụp khung hình
    const btnCapture = document.getElementById('btn-capture');
    if (btnCapture) {
        btnCapture.addEventListener('click', () => {
            captureFrame();
        });
    }

    // Gắn sự kiện cho nút Kết nối Camera / Chọn nguồn video
    const btnConnectCamera = document.getElementById('btn-connect-camera');
    if (btnConnectCamera) {
        btnConnectCamera.addEventListener('click', () => {
            setupLiveCamera();
        });
    }

    // Gắn sự kiện nút Xuất Excel
    const btnExportExcel = document.getElementById('btn-export');
    if (btnExportExcel) {
        btnExportExcel.addEventListener('click', () => {
            exportToExcel();
        });
    }

    // Cập nhật trạng thái ban đầu
    setStatus('ready', 'SYSTEM READY');
    updateUIStats();
});