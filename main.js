// main.js - File trung tâm khởi chạy ứng dụng AI Giám sát Giao thông

import { updateUIStats, setStatus, initDashboardEvents } from './dashboard.js';
import { startAI, stopAI, captureFrame, setupLiveCamera } from './video.js';

// Khai báo các biến toàn cục cho Canvas và AI Session
export let canvas, ctx;
export let inferenceCanvas, inferenceCtx;
export let latestDetections = [];
let running = false;
let inferencing = false;
let videoObjectUrl = null;

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
    canvas = document.getElementById('canvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
    }

    // 2. Khởi tạo Canvas phụ chuyên dùng cho AI suy luận (Inference)
    inferenceCanvas = document.createElement('canvas');
    inferenceCtx = inferenceCanvas.getContext('2d');

    // 3. Lấy phần tử video source
    const videoElement = document.getElementById('video-source');
    const uploadInput = document.getElementById('upload-video');
    const btnStart = document.getElementById('btn-start');
    const btnStop = document.getElementById('btn-stop');
    const btnCapture = document.getElementById('btn-capture');

    // 4. Lắng nghe sự kiện chọn file video từ máy tính
    if (uploadInput && videoElement) {
        uploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (running) stopAI();
                if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
                
                videoObjectUrl = URL.createObjectURL(file);
                videoElement.src = videoObjectUrl;
                videoElement.load();
                
                videoElement.onloadedmetadata = function() {
                    if (canvas) {
                        canvas.width = videoElement.videoWidth;
                        canvas.height = videoElement.videoHeight;
                        inferenceCanvas.width = canvas.width;
                        inferenceCanvas.height = canvas.height;
                        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                    }
                    // Mở khóa nút Chạy AI khi đã chọn video thành công
                    if (btnStart) btnStart.disabled = false;
                    setStatus('ready', 'AI READY');
                };
            }
        });
    }

    // 5. Khởi tạo các sự kiện giao diện nút bấm
    initDashboardEvents();

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            startAI();
        });
    }

    if (btnStop) {
        btnStop.addEventListener('click', () => {
            stopAI();
        });
    }

    if (btnCapture) {
        btnCapture.addEventListener('click', () => {
            captureFrame();
        });
    }

    const btnConnectCamera = document.getElementById('btn-live-camera');
    if (btnConnectCamera) {
        btnConnectCamera.addEventListener('click', () => {
            setupLiveCamera();
        });
    }

    // Cập nhật trạng thái ban đầu
    setStatus('ready', 'SYSTEM READY');
    updateUIStats();
});