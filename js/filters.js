// js/filters.js
// Lightweight, client-side filters: fast CSS preview + canvas post-processing

export const FILTERS = {
  none: {
    label: "None",
    css: "none",
    apply: (ctx, canvas) => {} // no-op
  },

  fairytale: {
    label: "Fairy Tale (Disney-ish)",
    css: "contrast(1.1) saturate(1.2) hue-rotate(8deg)",
    apply: (ctx, canvas) => {
      colorAdjust(ctx, canvas, { contrast: 1.1, saturation: 1.2, brightness: 1.02, hue: 8 });
    }
  },

  dreamworks: {
    label: "Dreamworks Glow (Pixar-ish)",
    css: "brightness(1.1) saturate(1.25)",
    apply: (ctx, canvas) => {
      colorAdjust(ctx, canvas, { brightness: 1.1, saturation: 1.25, contrast: 1.05 });
      softGlow(ctx, canvas, 0.15);
    }
  },

  brickify: {
    label: "Brickify (Lego)",
    css: "contrast(1.2) saturate(0.9)",
    apply: (ctx, canvas) => {
      pixelate(ctx, canvas, 12);
      posterize(ctx, canvas, 6);
    }
  },

  pixel: {
    label: "8-Bit Pixel",
    css: "contrast(1.4) saturate(1.3) brightness(0.95)",
    apply: (ctx, canvas) => {
      pixelate(ctx, canvas, 18);
      posterize(ctx, canvas, 5);
    }
  },

  vicecity: {
    label: "Vice City (GTA vibe)",
    css: "contrast(1.25) saturate(1.3) hue-rotate(-20deg)",
    apply: (ctx, canvas) => {
      colorAdjust(ctx, canvas, { contrast: 1.25, saturation: 1.3, hue: -20 });
    }
  },

  toonworld: {
    label: "Toon World (CN-ish)",
    css: "contrast(1.6) saturate(0.85)",
    apply: (ctx, canvas) => {
      posterize(ctx, canvas, 4);
      edgeDarken(ctx, canvas, 0.35);
    }
  },

  studiopastel: {
    label: "Studio Pastel (Ghibli-ish)",
    css: "brightness(1.08) saturate(0.85)",
    apply: (ctx, canvas) => {
      colorAdjust(ctx, canvas, { brightness: 1.08, saturation: 0.85, contrast: 0.98 });
    }
  }
};

// -------- Helpers -------- //

function getImageData(ctx, canvas) {
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function putImageData(ctx, imageData) {
  ctx.putImageData(imageData, 0, 0);
}

function colorAdjust(ctx, canvas, { brightness = 1, contrast = 1, saturation = 1, hue = 0 }) {
  const id = getImageData(ctx, canvas);
  const d = id.data;
  const b = brightness, c = contrast, s = saturation, h = hue * Math.PI / 180;

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i] / 255, g = d[i + 1] / 255, bch = d[i + 2] / 255;

    // brightness
    r *= b; g *= b; bch *= b;

    // convert to HSL-ish quick hack for saturation & hue rotate
    let max = Math.max(r, g, bch), min = Math.min(r, g, bch);
    let l = (max + min) / 2;
    let sat = max === min ? 0 : (l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min));
    // hue rotation using simple R'G'B' transform is easier:
    // cheap hue rotate matrix
    const cosA = Math.cos(h), sinA = Math.sin(h);
    const matrix = [
      0.213 + cosA * 0.787 - sinA * 0.213,
      0.715 - cosA * 0.715 - sinA * 0.715,
      0.072 - cosA * 0.072 + sinA * 0.928,
      0.213 - cosA * 0.213 + sinA * 0.143,
      0.715 + cosA * 0.285 + sinA * 0.140,
      0.072 - cosA * 0.072 - sinA * 0.283,
      0.213 - cosA * 0.213 - sinA * 0.787,
      0.715 - cosA * 0.715 + sinA * 0.715,
      0.072 + cosA * 0.928 + sinA * 0.072
    ];
    let nr = r * matrix[0] + g * matrix[1] + bch * matrix[2];
    let ng = r * matrix[3] + g * matrix[4] + bch * matrix[5];
    let nb = r * matrix[6] + g * matrix[7] + bch * matrix[8];

    // saturation
    const gray = 0.299 * nr + 0.587 * ng + 0.114 * nb;
    nr = gray + (nr - gray) * s;
    ng = gray + (ng - gray) * s;
    nb = gray + (nb - gray) * s;

    // contrast
    nr = ((nr - 0.5) * c + 0.5);
    ng = ((ng - 0.5) * c + 0.5);
    nb = ((nb - 0.5) * c + 0.5);

    d[i]     = Math.max(0, Math.min(255, nr * 255));
    d[i + 1] = Math.max(0, Math.min(255, ng * 255));
    d[i + 2] = Math.max(0, Math.min(255, nb * 255));
  }

  putImageData(ctx, id);
}

function posterize(ctx, canvas, levels = 6) {
  const id = getImageData(ctx, canvas);
  const d = id.data;
  const step = 255 / (levels - 1);

  for (let i = 0; i < d.length; i += 4) {
    d[i]     = Math.round(d[i] / step) * step;
    d[i + 1] = Math.round(d[i + 1] / step) * step;
    d[i + 2] = Math.round(d[i + 2] / step) * step;
  }

  putImageData(ctx, id);
}

function pixelate(ctx, canvas, blockSize = 10) {
  const w = canvas.width;
  const h = canvas.height;
  const id = getImageData(ctx, canvas);

  for (let y = 0; y < h; y += blockSize) {
    for (let x = 0; x < w; x += blockSize) {
      // sample top-left pixel
      const i = ((y * w) + x) * 4;
      const r = id.data[i], g = id.data[i + 1], b = id.data[i + 2], a = id.data[i + 3];

      for (let by = 0; by < blockSize; by++) {
        for (let bx = 0; bx < blockSize; bx++) {
          const px = x + bx;
          const py = y + by;
          if (px >= w || py >= h) continue;
          const p = ((py * w) + px) * 4;
          id.data[p] = r;
          id.data[p + 1] = g;
          id.data[p + 2] = b;
          id.data[p + 3] = a;
        }
      }
    }
  }

  putImageData(ctx, id);
}

// very cheap "edge" feel: darken darker pixels a bit
function edgeDarken(ctx, canvas, strength = 0.3) {
  const id = getImageData(ctx, canvas);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const avg = (d[i] + d[i+1] + d[i+2]) / 3;
    const k = avg < 128 ? (1 - strength) : 1;
    d[i] *= k; d[i+1] *= k; d[i+2] *= k;
  }
  putImageData(ctx, id);
}

function softGlow(ctx, canvas, amount = 0.2) {
  // Simple blur-ish glow: draw a scaled version over itself
  const w = canvas.width, h = canvas.height;
  const temp = document.createElement('canvas');
  temp.width = w;
  temp.height = h;
  const tctx = temp.getContext('2d');
  tctx.drawImage(canvas, 0, 0, w, h);
  ctx.globalAlpha = amount;
  ctx.drawImage(temp, -2, -2, w + 4, h + 4);
  ctx.globalAlpha = 1;
}

// Convenience functions
export function setPreviewFilter(videoEl, filterKey) {
  videoEl.style.filter = FILTERS[filterKey]?.css || 'none';
}

export function applyFilterToCanvas(ctx, canvas, filterKey) {
  const f = FILTERS[filterKey];
  if (!f || !f.apply) return;
  f.apply(ctx, canvas);
}
