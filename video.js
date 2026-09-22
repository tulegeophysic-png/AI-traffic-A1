// video.js - Quản lý luồng video, camera, xử lý frame và tích hợp AI YOLOv10

import { session } from './model.js';
import { preprocessWithLetterbox, parseYolov10Output } from './model.js';
import { canvas, ctx, inferenceCanvas, inferenceCtx, latestDetections, setLatestDetections, isInferencing, setInferencing, isRunning, setRunning } from './main.js';
import { matchAndCountVehicles } from './tracking.js';
import { drawScene } from './counting.js';
import { updateUIStats, setStatus } from './dashboard.js';

export const pipelineMetrics = { preprocess: 0, inference: 0, postprocess: 0, render: 0 };

let frameSkipCounter = 0;
const FRAME_SKIP_INTERVAL = 2; // Bỏ qua frame để tối ưu chống giật lag

export function processFrame() {
    if (!isRunning()) return;
    if (videoElement.paused || videoElement.ended) {
        stopAI();
        return;
    }

    const now = performance.now();
    updateFps(now);
    
    // 1. Vẽ video lên màn hình chính với kích thước chuẩn của canvas
    const tRenderStart = performance.now();
    if (videoElement.readyState >= videoElement.HAVE_CURRENT_DATA) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        drawScene(latestDetections);
    }
    pipelineMetrics.render = performance.now() - tRenderStart;

    // 2. Cơ chế bỏ frame thông minh giảm tải cho AI
    frameSkipCounter++;
    if (!isInferencing() && frameSkipCounter >= FRAME_SKIP_INTERVAL) {
        frameSkipCounter = 0;
        setInferencing(true);
        
        // Đồng bộ kích thước canvas phụ theo video gốc
        const vWidth = videoElement.videoWidth || canvas.width || 640;
        const vHeight = videoElement.videoHeight || canvas.height || 360;
        
        if (inferenceCanvas.width !== vWidth || inferenceCanvas.height !== vHeight) {
            inferenceCanvas.width = vWidth;
            inferenceCanvas.height = vHeight;
        }
        inferenceCtx.drawImage(videoElement, 0, 0, inferenceCanvas.width, inferenceCanvas.height);
        
        setTimeout(async () => {
            try {
                const tPre = performance.now();
                const { tensor, ratio, dw, dh } = preprocessWithLetterbox(inferenceCanvas, 640); 
                pipelineMetrics.preprocess = performance.now() - tPre;

                const tInf = performance.now();
                const results = await session.run({ [session.inputNames[0]]: tensor });
                pipelineMetrics.inference = performance.now() - tInf;

                const tPost = performance.now();
                const currentFps = window.__trafficFpsState ? window.__trafficFpsState.currentFps : 30;
                const detections = parseYolov10Output(results[session.outputNames[0]], canvas.width, canvas.height, ratio, dw, dh);
                
                setLatestDetections(matchAndCountVehicles(detections, canvas.width, canvas.height, currentFps > 0 ? currentFps : 30));
                pipelineMetrics.postprocess = performance.now() - tPost;

                updateUIStats();
            } catch (error) {
                console.error('Lỗi xử lý frame AI:', error);
            } finally {
                setInferencing(false);
            }
        }, 0);
    }

    requestAnimationFrame(processFrame);
}

export async function startAI() {
    if (!videoElement.src && !videoElement.srcObject) return;
    if (!session) return;
    try {
        await videoElement.play();
    } catch (error) {
        console.error('Không thể phát video/camera:', error);
        stopAI();
        return;
    }
    setRunning(true);
    const btnStart = document.getElementById('btn-start');
    const btnStop = document.getElementById('btn-stop');
    const btnCapture = document.getElementById('btn-capture');
    
    if (btnStart) btnStart.disabled = true;
    if (btnStop) btnStop.disabled = false;
    if (btnCapture) btnCapture.disabled = false;
    
    setStatus('ready', 'RUNNING');
    requestAnimationFrame(processFrame);
}

export function stopAI() {
    setRunning(false);
    if (videoElement) videoElement.pause();
    const hasSource = videoElement && (videoElement.src || videoElement.srcObject);
    
    const btnStart = document.getElementById('btn-start');
    const btnStop = document.getElementById('btn-stop');
    const btnCapture = document.getElementById('btn-capture');

    if (btnStart) btnStart.disabled = !(hasSource && session);
    if (btnStop) btnStop.disabled = true;
    if (btnCapture) btnCapture.disabled = true;
    
    setStatus('stopped', 'AI STOPPED');
}

export function captureFrame() {
    const link = document.createElement('a');
    link.download = `capture-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

export async function setupLiveCamera() {
    if (isRunning()) stopAI();
    
    const selectElement = document.getElementById('camera-url-select');
    let streamUrl = selectElement ? selectElement.value : '';

    if (!streamUrl) {
        streamUrl = prompt("Nhập địa chỉ URL luồng camera hoặc link video:", "");
    }

    if (!streamUrl) return;

    try {
        videoElement.srcObject = null;
        videoElement.src = streamUrl;
        videoElement.crossOrigin = "anonymous";
        videoElement.load();
        
        // Đảm bảo bắt sự kiện tải metadata an toàn
        videoElement.onloadedmetadata = () => {
            canvas.width = videoElement.videoWidth || 1280;
            canvas.height = videoElement.videoHeight || 720;
            inferenceCanvas.width = canvas.width;
            inferenceCanvas.height = canvas.height;
            
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            drawScene([]);
            
            if (session) {
                const btnStart = document.getElementById('btn-start');
                if (btnStart) btnStart.disabled = false;
                setStatus('ready', 'CAMERA READY');
            }
        };

        videoElement.onerror = (e) => {
            console.error("Lỗi khi tải nguồn video:", e);
            setStatus('error', 'LOAD ERROR');
        };

    } catch (error) {
        console.error('Lỗi kết nối camera/video:', error);
    }
}

function updateFps(now) {
    const state = getFpsState();
    state.frameCount++;
    if (now - state.lastTime >= 1000) {
        state.currentFps = (state.frameCount * 1000) / (now - state.lastTime);
        const fpsDisp = document.getElementById('fps-display');
        if (fpsDisp) fpsDisp.innerText = state.currentFps.toFixed(1);
        state.frameCount = 0;
        state.lastTime = now;
    }
}

function getFpsState() {
    if (!window.__trafficFpsState) {
        window.__trafficFpsState = { lastTime: performance.now(), frameCount: 0, currentFps: 0 };
    }
    return window.__trafficFpsState;
}

const videoElement = document.getElementById('video-source');