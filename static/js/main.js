let stream = null;
let socket = null;
let isRealTimeDetection = false;
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const resultImage = document.getElementById('resultImage');
const startButton = document.getElementById('startCamera');
const stopButton = document.getElementById('stopCamera');
const captureButton = document.getElementById('captureImage');
const imageUpload = document.getElementById('imageUpload');
const statusText = document.getElementById('statusText');
const realTimeToggle = document.getElementById('realTimeToggle');

// Initialize WebSocket connection
function initializeSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('WebSocket connected');
    });
    
    socket.on('processed_frame', (data) => {
        if (isRealTimeDetection) {
            resultImage.src = data.image;
            requestAnimationFrame(sendFrame);
        }
    });
    
    socket.on('error', (data) => {
        console.error('Server error:', data.message);
        statusText.textContent = 'Error: ' + data.message;
    });
}

// Frame sending function
function sendFrame() {
    if (!isRealTimeDetection) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    socket.emit('frame', canvas.toDataURL('image/jpeg', 0.5));
}

// Camera controls
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        video.srcObject = stream;
        startButton.disabled = true;
        stopButton.disabled = false;
        captureButton.disabled = false;
        realTimeToggle.disabled = false;
        statusText.textContent = 'Camera started';
        
        // Initialize WebSocket when camera starts
        if (!socket) {
            initializeSocket();
        }
    } catch (err) {
        console.error('Error accessing camera:', err);
        statusText.textContent = 'Error accessing camera';
    }
}

function stopCamera() {
    if (stream) {
        isRealTimeDetection = false;
        realTimeToggle.checked = false;
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        startButton.disabled = false;
        stopButton.disabled = true;
        captureButton.disabled = true;
        realTimeToggle.disabled = true;
        statusText.textContent = 'Camera stopped';
        resultImage.style.display = 'none';
        video.style.display = 'block';
    }
}

// Toggle real-time detection
function toggleRealTimeDetection(event) {
    isRealTimeDetection = event.target.checked;
    if (isRealTimeDetection) {
        video.style.display = 'none';
        resultImage.style.display = 'block';
        statusText.textContent = 'Real-time detection active';
        sendFrame(); // Start the frame sending loop
    } else {
        video.style.display = 'block';
        resultImage.style.display = 'none';
        statusText.textContent = 'Real-time detection stopped';
    }
}

// Image capture and processing
function captureImage() {
    isRealTimeDetection = false;
    realTimeToggle.checked = false;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    processImage(canvas.toDataURL('image/jpeg'));
}

// File upload handling
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => processImage(e.target.result);
        reader.readAsDataURL(file);
    }
});

// Image processing for single captures
async function processImage(imageData) {
    try {
        statusText.textContent = 'Processing image...';
        
        const response = await fetch('/detect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData })
        });
        
        const data = await response.json();
        
        if (data.success) {
            resultImage.src = data.processed_image;
            resultImage.style.display = 'block';
            video.style.display = 'none';
            statusText.textContent = 'Detection complete';
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Error processing image:', error);
        statusText.textContent = 'Error processing image';
    }
}

// Event listeners
startButton.addEventListener('click', startCamera);
stopButton.addEventListener('click', stopCamera);
captureButton.addEventListener('click', captureImage);
realTimeToggle.addEventListener('change', toggleRealTimeDetection);

// Initialize
captureButton.disabled = true;
realTimeToggle.disabled = true;