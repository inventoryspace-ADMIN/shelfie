// Client-side, canvas-only background removal. No ML model, no external
// service — this is a flood fill from the image's edges, not a full-image
// color threshold. That distinction matters: flood-filling only removes
// background pixels that are actually *connected* to the border, so a
// light-colored item on a light background doesn't get holes punched
// through its middle just because some interior pixel happens to match
// the background color.
//
// Known limitation, documented rather than hidden: this works well for
// product photos on a plain, fairly uniform background (a shelf, a wall,
// a sheet of paper) and works poorly on busy or textured backgrounds. The
// documented upgrade path if that's not good enough is swapping this one
// function for a paid ML background-removal API — every caller only ever
// deals with "a PNG path," never with how the transparency was produced.

const MAX_DIMENSION = 1200;
const DEFAULT_THRESHOLD = 45;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function isBackgroundRemovalSupported(): boolean {
  return (
    typeof document !== "undefined" &&
    !!document.createElement("canvas").getContext
  );
}

export async function removeBackground(
  imageDataUrl: string,
  threshold: number = DEFAULT_THRESHOLD
): Promise<string> {
  const img = await loadImage(imageDataUrl);

  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(img.width, img.height) || 1
  );
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not supported in this browser");
  }

  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  // Sample the background color from the border pixels.
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let borderCount = 0;
  const addSample = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    sumR += data[i];
    sumG += data[i + 1];
    sumB += data[i + 2];
    borderCount++;
  };
  for (let x = 0; x < width; x++) {
    addSample(x, 0);
    addSample(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    addSample(0, y);
    addSample(width - 1, y);
  }
  const bgR = sumR / borderCount;
  const bgG = sumG / borderCount;
  const bgB = sumB / borderCount;

  // Flood fill from every border pixel, 4-connected, marking pixels
  // within `threshold` of the sampled background color as transparent.
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let queueEnd = 0;

  const tryEnqueue = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const i = idx * 4;
    const distance = colorDistance(
      data[i],
      data[i + 1],
      data[i + 2],
      bgR,
      bgG,
      bgB
    );
    if (distance > threshold) return;
    visited[idx] = 1;
    queue[queueEnd++] = idx;
  };

  for (let x = 0; x < width; x++) {
    tryEnqueue(x, 0);
    tryEnqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryEnqueue(0, y);
    tryEnqueue(width - 1, y);
  }

  let queueStart = 0;
  while (queueStart < queueEnd) {
    const idx = queue[queueStart++];
    const x = idx % width;
    const y = Math.floor(idx / width);
    data[idx * 4 + 3] = 0;
    tryEnqueue(x - 1, y);
    tryEnqueue(x + 1, y);
    tryEnqueue(x, y - 1);
    tryEnqueue(x, y + 1);
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}
