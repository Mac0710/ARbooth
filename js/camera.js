const videoElement = document.getElementById('camera');
const countdownElement = document.getElementById('countdown');
const progressElement = document.getElementById('progress');
const captureBtn = document.getElementById('captureBtn');
const countdownSelect = document.getElementById('countdownSelect');
const filterSelect = document.getElementById('filterSelect');

let totalShots = 1;
let captured = [];
let currentShot = 0;

let stream = null;

// figure total shots from chosen layout
function resolveTotalShots() {
  const layout = localStorage.getItem('chosenLayout') || 'single';
  switch (layout) {
    case 'strip': return 3;
    case 'grid': return 4;
    default: return 1;
  }
}

async function initCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
  } catch (err) {
    alert('Camera access denied or not available.');
    console.error(err);
  }
}

function updateProgress() {
  progressElement.textContent = `Photo ${currentShot + 1} of ${totalShots}`;
}

// Countdown before capture
function startCountdown() {
  const seconds = parseInt(countdownSelect.value, 10) || 3;
  let count = seconds;
  countdownElement.innerText = count;
  const countdownTimer = setInterval(() => {
    count--;
    if (count > 0) {
      countdownElement.innerText = count;
    } else {
      clearInterval(countdownTimer);
      countdownElement.innerText = '📸';
      setTimeout(() => {
        capturePhoto();
        countdownElement.innerText = '';
      }, 200);
    }
  }, 1000);
}

// Apply a placeholder filter via CSS (for now)
function applyPreviewFilter(filterName) {
  // simple placeholders; real ones later with ML / WebGL
  const filters = {
    none: 'none',
    fairytale: 'contrast(1.1) saturate(1.2) hue-rotate(10deg)',
    dreamworks: 'brightness(1.1) saturate(1.3)',
    brickify: 'contrast(1.2) saturate(0.9)',
    pixel: 'contrast(1.4) saturate(1.5) brightness(0.9)',
    vicecity: 'contrast(1.3) saturate(1.4) hue-rotate(-20deg)',
    toonworld: 'contrast(1.6) saturate(0.8)',
    studiopastel: 'brightness(1.1) saturate(0.8)'
  };
  videoElement.style.filter = filters[filterName] || 'none';
}

filterSelect?.addEventListener('change', (e) => {
  applyPreviewFilter(e.target.value);
});

// Capture the photo from the video (un-mirrored in final output)
function capturePhoto() {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');

  // because video is mirrored with CSS, we must flip it back when drawing
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);

  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  const dataURL = canvas.toDataURL('image/png');
  captured.push(dataURL);
  currentShot++;

  if (currentShot < totalShots) {
    updateProgress();
    setTimeout(startCountdown, 800);
  } else {
    // Store for next page
    localStorage.setItem('capturedPhotos', JSON.stringify(captured));
    // TODO: move to customize.html and compose layout
    localStorage.setItem('capturedPhotos', JSON.stringify(captured));
goTo('customize.html');
  }
}

captureBtn?.addEventListener('click', () => {
  currentShot = 0;
  captured = [];
  totalShots = resolveTotalShots();
  updateProgress();
  startCountdown();
});

initCamera();
applyPreviewFilter('none');
totalShots = resolveTotalShots();
updateProgress();
