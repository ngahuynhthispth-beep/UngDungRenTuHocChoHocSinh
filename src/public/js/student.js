// student.js - Core AI behavior detection engine
// Uses MediaPipe Pose to detect studying behavior

const socket = io();

// ============ STATE ============
let currentState = 'studying';   // 'studying' | 'distracted' | 'not_studying'
let roomCode = '';
let studentId = null;
let sessionActive = false;

// Timers
let startTime = null;
let timerInterval = null;
let focusSeconds = 0;
let distractedSeconds = 0;
let notStudyingSeconds = 0;
let violationCount = 0;
let lastStateChange = Date.now();
let idleStartTime = null;

// AI tracking
let previousWristPositions = [];
let stateDebounceTimer = null;
const STATE_DEBOUNCE_MS = 3000;  // 3 seconds to prevent flickering
const IDLE_THRESHOLD_MS = 5000;  // 5 seconds (much stricter than 15s)
const MOVEMENT_THRESHOLD = 0.015; // Minimum wrist movement delta
const MOVEMENT_HISTORY = 15;     // Frames to track

// Voice alert
let lastAlertTime = 0;
const ALERT_COOLDOWN_MS = 12000; // 12s cooldown (5s speech + 7s grace)
let alertCount = 0;
let audioCtx = null;

// ============ ROOM ENTRY ============
const roomCodeInput = document.getElementById('roomCodeInput');
const joinBtn = document.getElementById('joinBtn');

roomCodeInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
});

joinBtn.addEventListener('click', async () => {
    // PRE-WARM SPEECH API FOR iOS
    if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance('');
        u.volume = 0;
        window.speechSynthesis.speak(u);
    }
    
    // PRE-WARM AUDIO API
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass && !audioCtx) {
        try {
            audioCtx = new AudioContextClass();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            gain.gain.value = 0;
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.01);
        } catch(e) {}
    }

    const code = roomCodeInput.value.trim();
    if (code.length !== 6) {
        showToast('Mã phòng phải đủ 6 ký tự', 'error');
        return;
    }

    joinBtn.disabled = true;
    joinBtn.textContent = 'Đang kết nối...';

    try {
        const res = await fetch('/api/students/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_code: code })
        });
        const data = await res.json();

        if (data.success) {
            roomCode = data.student.room_code;
            studentId = data.student.id;
            showToast(`Chào ${data.student.name}! Đang bật camera...`);
            startStudySession();
        } else {
            showToast(data.message, 'error');
            joinBtn.disabled = false;
            joinBtn.textContent = '🚀 Bắt đầu học';
        }
    } catch (err) {
        showToast('Lỗi kết nối server', 'error');
        joinBtn.disabled = false;
        joinBtn.textContent = '🚀 Bắt đầu học';
    }
});

// ============ START SESSION ============
async function startStudySession() {
    document.getElementById('roomEntry').style.display = 'none';
    document.getElementById('studyScreen').style.display = 'flex';

    startTime = Date.now();
    sessionActive = true;

    // Start timer
    timerInterval = setInterval(updateTimer, 1000);

    // Notify server
    socket.emit('session:start', { room_code: roomCode, student_id: studentId });

    // Start camera + AI
    await initCamera();
}

// ============ TIMER ============
function updateTimer() {
    if (!startTime) return;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    document.getElementById('timer').textContent = `${h}:${m}:${s}`;

    // Track time per state
    if (currentState === 'studying') focusSeconds++;
    else if (currentState === 'distracted') distractedSeconds++;
    else notStudyingSeconds++;

    // Update focus percentage
    const totalSecs = focusSeconds + distractedSeconds + notStudyingSeconds;
    const focusPct = totalSecs > 0 ? Math.round((focusSeconds / totalSecs) * 100) : 100;
    document.getElementById('focusPercent').textContent = `${focusPct}%`;

    const bar = document.getElementById('focusBar');
    bar.style.width = `${focusPct}%`;
    bar.className = `progress-fill ${focusPct >= 70 ? 'good' : focusPct >= 40 ? 'warning' : 'danger'}`;

    // Send time update to server every 10 seconds
    if (totalSecs % 10 === 0) {
        socket.emit('time:update', {
            room_code: roomCode,
            focus_seconds: focusSeconds,
            distracted_seconds: distractedSeconds,
            not_studying_seconds: notStudyingSeconds
        });
    }
}

// ============ CAMERA + MEDIAPIPE ============
async function initCamera() {
    const video = document.getElementById('videoEl');
    const canvas = document.getElementById('canvasEl');
    const placeholder = document.getElementById('cameraPlaceholder');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });
        
        // Force iOS to play inline instead of full-screen player
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.disablePictureInPicture = true;
        
        video.srcObject = stream;
        await video.play();
        placeholder.style.display = 'none';

        // Setup canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Init MediaPipe Pose
        initPoseDetection(video, canvas);

    } catch (err) {
        console.error('Camera error:', err);
        placeholder.innerHTML = `
            <div class="icon">🚫</div>
            <p>Không thể bật camera</p>
            <p style="font-size:12px;color:var(--text-dark);">Vui lòng cho phép camera trong cài đặt trình duyệt</p>
        `;
    }
}

function initPoseDetection(video, canvas) {
    const ctx = canvas.getContext('2d');

    const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`
    });

    pose.setOptions({
        modelComplexity: 0,    // 0 = Lite (fastest, good for mobile)
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    pose.onResults((results) => {
        // Draw
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.poseLandmarks) {
            // Draw skeleton (optional, subtle)
            drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
                color: 'rgba(16, 185, 129, 0.3)',
                lineWidth: 2
            });
            drawLandmarks(ctx, results.poseLandmarks, {
                color: 'rgba(16, 185, 129, 0.5)',
                lineWidth: 1,
                radius: 3
            });

            // Analyze behavior
            analyzeBehavior(results.poseLandmarks);
        } else {
            // No pose detected
            handleNoPose();
        }
    });

    // Use MediaPipe Camera utility for continuous processing
    const camera = new Camera(video, {
        onFrame: async () => {
            await pose.send({ image: video });
        },
        width: 640,
        height: 480
    });
    camera.start();
}

// ============ BEHAVIOR ANALYSIS ============
function analyzeBehavior(landmarks) {
    // Key landmarks
    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];

    // 1. Check body visibility
    const bodyVisible = (leftShoulder.visibility > 0.5 || rightShoulder.visibility > 0.5);
    if (!bodyVisible) {
        handleNoPose();
        return;
    }

    // 2. Head down check (hơi cúi xuống)
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
    const headDown = nose.y > shoulderMidY - 0.08; // Relaxed threshold for slight bow

    // 3. Check wrist movement
    const currentWrist = {
        lx: leftWrist.x, ly: leftWrist.y,
        rx: rightWrist.x, ry: rightWrist.y,
        lv: leftWrist.visibility, rv: rightWrist.visibility
    };

    previousWristPositions.push(currentWrist);
    if (previousWristPositions.length > MOVEMENT_HISTORY) {
        previousWristPositions.shift();
    }

    const handMoving = detectHandMovement();

    // 4. Classify state
    let newState = currentState;

    if (headDown && handMoving) {
        // Tối ưu nhất: Đầu cúi xuống và tay đang di chuyển (tay viết bài)
        newState = 'studying';
        idleStartTime = null;
    } else if (headDown && !handMoving) {
        // Đầu cúi xuống nhưng tay không di chuyển (có thể đang đọc bài hoặc suy nghĩ)
        if (!idleStartTime) {
            idleStartTime = Date.now();
        }
        const idleDuration = Date.now() - idleStartTime;
        if (idleDuration > 10000) { // Cho phép ngồi im đọc bài 10 giây
            newState = 'distracted';
        } else {
            newState = 'studying'; 
        }
    } else if (!headDown) {
        // Ngẩng đầu lên (nhìn đi chỗ khác hoặc màn hình)
        if (!idleStartTime) {
            idleStartTime = Date.now();
        }
        const idleDuration = Date.now() - idleStartTime;
        if (idleDuration > 5000) { // Cho phép ngẩng đầu nghỉ ngơi/điều chỉnh tư thế 5 giây
            newState = 'distracted';
        } else {
            // Trong thời gian 5 giây ân hạn, nếu trước đó đang học thì vẫn giữ là đang học
            newState = currentState === 'studying' ? 'studying' : 'distracted';
        }
    }

    // Apply state with debounce
    applyState(newState);
}

function detectHandMovement() {
    if (previousWristPositions.length < 5) return true; // Not enough data, assume moving

    let totalDelta = 0;
    for (let i = 1; i < previousWristPositions.length; i++) {
        const prev = previousWristPositions[i - 1];
        const curr = previousWristPositions[i];

        // Calculate movement for whichever wrist is visible
        if (curr.lv > 0.5) {
            totalDelta += Math.abs(curr.lx - prev.lx) + Math.abs(curr.ly - prev.ly);
        }
        if (curr.rv > 0.5) {
            totalDelta += Math.abs(curr.rx - prev.rx) + Math.abs(curr.ry - prev.ry);
        }
    }

    const avgDelta = totalDelta / previousWristPositions.length;
    return avgDelta > MOVEMENT_THRESHOLD;
}

function handleNoPose() {
    if (!idleStartTime) {
        idleStartTime = Date.now();
    }
    const idleDuration = Date.now() - idleStartTime;
    if (idleDuration > 5000) { // 5 seconds with no pose
        applyState('not_studying');
    }
}

// ============ STATE MANAGEMENT ============
function applyState(newState) {
    if (newState === currentState) {
        // If still distracted, re-trigger violation using cooldown interval
        if (newState === 'distracted' || newState === 'not_studying') {
            const now = Date.now();
            if (now - lastAlertTime >= ALERT_COOLDOWN_MS) {
                recordViolation(newState);
            }
        }
        return;
    }

    // Debounce: don't change state too quickly
    if (stateDebounceTimer) return;

    stateDebounceTimer = setTimeout(() => {
        stateDebounceTimer = null;
    }, STATE_DEBOUNCE_MS);

    const previousState = currentState;
    currentState = newState;
    lastStateChange = Date.now();

    // Update UI
    updateStateUI(newState);

    // Notify server
    socket.emit('status:update', {
        room_code: roomCode,
        state: newState,
        timestamp: new Date().toISOString()
    });

    // Handle violations
    if (newState === 'distracted' || newState === 'not_studying') {
        if (previousState === 'studying') {
            recordViolation(newState);
        }
    } else if (newState === 'studying') {
        // Clear alerts
        clearAlert();
        idleStartTime = null;
    }
}

function recordViolation(type) {
    violationCount++;
    document.getElementById('violationCount').textContent = `⚠️ Vi phạm: ${violationCount} lần`;

    socket.emit('violation:new', {
        room_code: roomCode,
        type: type,
        timestamp: new Date().toISOString()
    });

    triggerAlert(type);
}

function updateStateUI(state) {
    const badge = document.getElementById('statusBadge');
    const overlay = document.getElementById('alertOverlay');

    switch (state) {
        case 'studying':
            badge.className = 'status-badge status-studying';
            badge.textContent = '✅ Đang học';
            overlay.className = 'alert-overlay';
            break;
        case 'distracted':
            badge.className = 'status-badge status-distracted';
            badge.textContent = '⚠️ Mất tập trung';
            overlay.className = 'alert-overlay distracted';
            break;
        case 'not_studying':
            badge.className = 'status-badge status-not-studying';
            badge.textContent = '❌ Không học';
            overlay.className = 'alert-overlay active';
            break;
    }
}

// ============ ALERTS ============
function triggerAlert(type) {
    const now = Date.now();
    if (now - lastAlertTime < ALERT_COOLDOWN_MS) return; // Cooldown

    lastAlertTime = now;
    alertCount++;
    
    // Play loud alarm beep
    playAlarmSound();

    // Big Flash Alert
    const bigAlert = document.getElementById('bigFlashAlert');
    bigAlert.classList.add('flashing');
    setTimeout(() => bigAlert.classList.remove('flashing'), 1500); // ~5 flashes

    // Show warning banner
    const banner = document.getElementById('warningBanner');
    banner.classList.add('show');
    setTimeout(() => banner.classList.remove('show'), 5000);

    // Voice alert
    speakAlert();
}

function speakAlert() {
    if (!('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance('CẢNH BÁO. CẢNH BÁO. MẤT TẬP TRUNG. YÊU CẦU QUAY LẠI HỌC BÀI NGAY.');
    utterance.lang = 'vi-VN';
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    utterance.volume = 1.0; // Max volume

    // Try to find Vietnamese voice
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.startsWith('vi'));
    if (viVoice) utterance.voice = viVoice;

    window.speechSynthesis.speak(utterance);
}

function playAlarmSound() {
    if (!audioCtx) return;
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        // Play 3 loud siren beeps
        for (let i = 0; i < 3; i++) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime + i * 0.4);
            osc.frequency.setValueAtTime(1200, audioCtx.currentTime + i * 0.4 + 0.1);
            
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime + i * 0.4);
            gain.gain.setValueAtTime(0, audioCtx.currentTime + i * 0.4 + 0.3);
            
            osc.start(audioCtx.currentTime + i * 0.4);
            osc.stop(audioCtx.currentTime + i * 0.4 + 0.3);
        }
    } catch(e) { console.error('Audio error', e); }
}

function clearAlert() {
    const banner = document.getElementById('warningBanner');
    banner.classList.remove('show');
}

// Load voices
if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}

// ============ END SESSION ============
document.getElementById('endSessionBtn').addEventListener('click', () => {
    endSession();
});

function endSession() {
    if (!sessionActive) return;
    sessionActive = false;

    // Stop timer
    clearInterval(timerInterval);

    // Stop camera
    const video = document.getElementById('videoEl');
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }

    // Calculate summary
    const totalSecs = focusSeconds + distractedSeconds + notStudyingSeconds;
    const focusPct = totalSecs > 0 ? Math.round((focusSeconds / totalSecs) * 100) : 0;

    const summary = {
        focus_seconds: focusSeconds,
        distracted_seconds: distractedSeconds,
        not_studying_seconds: notStudyingSeconds,
        violation_count: violationCount,
        focus_percent: focusPct
    };

    // Notify server
    socket.emit('session:end', { room_code: roomCode, summary });

    // Check reward
    const totalMin = Math.round(totalSecs / 60);
    const dMin = Math.round(distractedSeconds / 60);
    
    if (violationCount <= 1 && totalSecs > 0) {
        showBlindBag(totalMin, focusPct, violationCount, dMin);
    } else {
        showSummaryModal(totalMin, focusPct, violationCount, dMin);
    }
}

const rewards = [
    "🎨 Được đi tô tượng", 
    "✏️ Được mua bút chì mới", 
    "🍦 Được đi ăn kem", 
    "🍕 Được đi ăn pizza"
];

function showBlindBag(totalMin, focusPct, violationCount, dMin) {
    const modal = document.getElementById('blindBagModal');
    const gacha = document.getElementById('blindBagGacha');
    const resultDiv = document.getElementById('blindBagResult');
    const rewardItem = document.getElementById('rewardItem');
    const claimBtn = document.getElementById('claimRewardBtn');
    
    modal.classList.add('show');
    
    gacha.onclick = () => {
        gacha.children[0].classList.add('shake');
        
        // Pick reward
        setTimeout(() => {
            gacha.style.display = 'none';
            resultDiv.style.display = 'block';
            rewardItem.textContent = rewards[Math.floor(Math.random() * rewards.length)];
        }, 1500); // shake for 1.5s
    };
    
    claimBtn.onclick = () => {
        modal.classList.remove('show');
        showSummaryModal(totalMin, focusPct, violationCount, dMin);
    };
}

function showSummaryModal(totalMin, focusPct, violationCount, dMin) {
    document.getElementById('sumTime').textContent = `${totalMin}p`;
    document.getElementById('sumFocus').textContent = `${focusPct}%`;
    document.getElementById('sumViolations').textContent = violationCount;
    document.getElementById('sumDistracted').textContent = `${dMin}p`;
    document.getElementById('summaryModal').classList.add('show');
}

// ============ TOAST ============
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (sessionActive) {
        socket.emit('session:end', {
            room_code: roomCode,
            summary: {
                focus_seconds: focusSeconds,
                distracted_seconds: distractedSeconds,
                not_studying_seconds: notStudyingSeconds,
                violation_count: violationCount
            }
        });
    }
});
