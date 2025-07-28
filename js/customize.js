// customize.js (fixed)

const finalCanvas = document.getElementById('finalCanvas');
const ctx = finalCanvas.getContext('2d');

let photos = JSON.parse(localStorage.getItem('capturedPhotos')) || [];
const chosenLayout = localStorage.getItem('chosenLayout') || 'single';
let frameColor = "#1E3A8A"; // default frame color

function buildLayout() {
  if (photos.length === 0) {
    alert('No photos found! Returning to start.');
    goTo('index.html');
    return;
  }

  const singleWidth = 500;
  const singleHeight = 400;

  if (chosenLayout === 'single') {
    finalCanvas.width = singleWidth;
    finalCanvas.height = singleHeight;
    drawSingle();
  } else if (chosenLayout === 'strip') {
    finalCanvas.width = 300;   // fixed width for strips
    finalCanvas.height = 600;  // fixed height for strips
    drawStrip();
  } else if (chosenLayout === 'grid') {
    finalCanvas.width = 500;   // fixed width for grid
    finalCanvas.height = 500;  // fixed height for grid
    drawGrid();
  }
} // <-- THIS was missing

function drawSingle() {
  ctx.fillStyle = frameColor;
  ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

  const img = new Image();
  img.src = photos[0];
  img.onload = () => {
    ctx.drawImage(img, 20, 20, finalCanvas.width - 40, finalCanvas.height - 40);
  };
}

function drawStrip() {
  ctx.fillStyle = frameColor;
  ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

  const spacing = 10;
  const photoHeight = (finalCanvas.height - (photos.length + 1) * spacing) / photos.length;
  const photoWidth = finalCanvas.width - (spacing * 2);

  const loadedImages = [];
  let loadedCount = 0;

  photos.forEach((photo, i) => {
    const img = new Image();
    img.src = photo;
    img.onload = () => {
      loadedImages[i] = img;
      loadedCount++;

      if (loadedCount === photos.length) {
        loadedImages.forEach((image, idx) => {
          ctx.drawImage(
            image,
            spacing,
            spacing + idx * (photoHeight + spacing),
            photoWidth,
            photoHeight
          );
        });
      }
    };
  });
}

function drawGrid() {
  ctx.fillStyle = frameColor;
  ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

  const spacing = 10;
  const photoWidth = (finalCanvas.width - spacing * 3) / 2;
  const photoHeight = (finalCanvas.height - spacing * 3) / 2;

  const loadedImages = [];
  let loadedCount = 0;

  photos.forEach((photo, i) => {
    const img = new Image();
    img.src = photo;
    img.onload = () => {
      loadedImages[i] = img;
      loadedCount++;

      if (loadedCount === photos.length) {
        loadedImages.forEach((image, idx) => {
          const x = spacing + (idx % 2) * (photoWidth + spacing);
          const y = spacing + Math.floor(idx / 2) * (photoHeight + spacing);
          ctx.drawImage(image, x, y, photoWidth, photoHeight);
        });
      }
    };
  });
}

// Color palette events
document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    frameColor = btn.getAttribute('data-color');
    buildLayout();
  });
});

// Download
document.getElementById('downloadBtn').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'photobooth.png';
  link.href = finalCanvas.toDataURL('image/png');
  link.click();
});

buildLayout();
