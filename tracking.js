// tracking.js - Quản lý Centroid Tracker và Phân làn Trái/Phải cho phương tiện

let nextVehicleId = 1;
let trackedVehicles = new Map(); // Lưu trữ các xe đang được tracking: Map<id, {x1, y1, x2, y2, class, lane, counted}>

// Thống kê đếm xe theo phân loại và làn
export const vehicleStats = {
    car: { left: 0, right: 0, total: 0 },
    motorcycle: { left: 0, right: 0, total: 0 },
    bus: { left: 0, right: 0, total: 0 },
    truck: { left: 0, right: 0, total: 0 }
};

export function resetVehicleStats() {
    for (let key in vehicleStats) {
        vehicleStats[key].left = 0;
        vehicleStats[key].right = 0;
        vehicleStats[key].total = 0;
    }
    trackedVehicles.clear();
    nextVehicleId = 1;
}

/**
 * Xác định xe thuộc Làn Trái hay Làn Phải dựa vào vạch kẻ dọc giữa màn hình (hoặc trung tâm khung hình)
 */
function determineLane(x1, x2, frameWidth = 1280) {
    const centerX = (x1 + x2) / 2;
    const splitX = frameWidth / 2; // Vạch phân định trung tâm (có thể tinh chỉnh theo vạch xanh trên video)
    
    return centerX < splitX ? 'left' : 'right';
}

/**
 * Thực hiện tracking đơn giản dựa trên khoảng cách tâm (Centroid Tracker) và tính toán phân làn
 */
export function matchAndCountVehicles(detections, frameWidth = 1280, frameHeight = 720) {
    const currentFrameVehicles = [];

    // 1. Chuẩn bị danh sách bounding box của frame hiện tại
    detections.forEach(det => {
        const [x1, y1, x2, y2] = det.box;
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        const lane = determineLane(x1, x2, frameWidth);

        currentFrameVehicles.push({
            x1, y1, x2, y2,
            centerX, centerY,
            class: det.class.toLowerCase(),
            score: det.score,
            lane,
            matched: false
        });
    });

    const updatedTrackedVehicles = new Map();

    // 2. Ghép nối với các ID cũ đang tracking (dựa vào khoảng cách tâm gần nhất)
    currentFrameVehicles.forEach(curr => {
        let bestMatchId = null;
        let minDistance = 60; // Ngưỡng khoảng cách tối đa để nhận diện là cùng một xe qua các frame

        trackedVehicles.forEach((tracked, id) => {
            if (tracked.class === curr.class && !tracked.assigned) {
                const dist = Math.hypot(curr.centerX - tracked.centerX, curr.centerY - tracked.centerY);
                if (dist < minDistance) {
                    minDistance = dist;
                    bestMatchId = id;
                }
            }
        });

        if (bestMatchId !== null) {
            // Cập nhật tọa độ cho xe đã có ID
            const tracked = trackedVehicles.get(bestMatchId);
            tracked.x1 = curr.x1;
            tracked.y1 = curr.y1;
            tracked.x2 = curr.x2;
            tracked.y2 = curr.y2;
            tracked.centerX = curr.centerX;
            tracked.centerY = curr.centerY;
            tracked.lane = curr.lane;
            tracked.assigned = true;

            // Kiểm tra điều kiện vượt vạch đếm (Ví dụ: xe đi xuống qua giữa màn hình Y > frameHeight / 2)
            const countingLineY = frameHeight / 2;
            if (!tracked.counted && tracked.centerY > countingLineY) {
                tracked.counted = true;
                const cls = tracked.class;
                
                if (vehicleStats[cls]) {
                    if (tracked.lane === 'left') {
                        vehicleStats[cls].left++;
                    } else {
                        vehicleStats[cls].right++;
                    }
                    vehicleStats[cls].total = vehicleStats[cls].left + vehicleStats[cls].right;
                }
            }

            updatedTrackedVehicles.set(bestMatchId, tracked);
        } else {
            // Tạo ID mới nếu là xe xuất hiện lần đầu
            const newId = nextVehicleId++;
            const counted = false;
            
            updatedTrackedVehicles.set(newId, {
                ...curr,
                id: newId,
                counted,
                assigned: true
            });
        }
    });

    trackedVehicles = updatedTrackedVehicles;

    // Trả về danh sách để render lên UI
    const resultList = [];
    trackedVehicles.forEach(v => resultList.push(v));
    return resultList;
}