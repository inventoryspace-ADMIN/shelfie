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
export const DEFAULT_THRESHOLD = 45;
// The feather/defringe pass (below) runs at threshold + a margin, not
// threshold itself — it's deliberately allowed a bit more reach than the
// main fill to catch the blended edge pixels the main fill's harder cutoff
// leaves behind. That margin used to be a flat +30 regardless of the
// caller's threshold, which meant it barely tightened at all as "Remove
// less" pushed threshold down — at the tightest setting it stayed close to
// the untouched default's aggressiveness, so it ended up doing most of the
// actual removal (with an algorithm meant for a thin edge band, not bulk
// clearing) and visibly eating into the item on a photo whose colors sit
// close to its background. Expressing it as a ratio of threshold instead
// means it shrinks together with "Remove less" — this ratio is calibrated
// so DEFAULT_THRESHOLD still produces exactly the old flat 30, leaving the
// default experience unchanged.
const FEATHER_RATIO = 30 / DEFAULT_THRESHOLD;
const MIN_FEATHER_WIDTH = 8; // never soften so little the old dark-ring bug comes back
const CROP_PADDING_RATIO = 0.04;

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

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// The primary flood fill + feather/defringe pass, factored out so it can
// run twice per removeBackground() call: once for the actual pixels the
// caller's threshold produces, and — only when that threshold isn't the
// default — a second throwaway pass at DEFAULT_THRESHOLD purely to decide
// where to crop. See the "reference bounds" comment in removeBackground
// for why the crop can't just use whichever threshold the caller picked.
// Mutates `data` in place (alpha + un-blended color); returns the bounding
// box of what's left non-transparent, or null if nothing survived.
function applyRemoval(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  bgR: number,
  bgG: number,
  bgB: number,
  threshold: number
): Bounds | null {
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let queueEnd = 0;

  const tryEnqueue = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const i = idx * 4;
    const distance = colorDistance(data[i], data[i + 1], data[i + 2], bgR, bgG, bgB);
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

  // Soften the hard flood-fill boundary, and defringe it — see
  // removeBackground's original comment for the full reasoning. `threshold`
  // (and therefore looseThreshold) is per-call so the reference pass below
  // always feathers at the default's own margin, not the caller's.
  const featherWidth = Math.max(MIN_FEATHER_WIDTH, Math.round(threshold * FEATHER_RATIO));
  const looseThreshold = threshold + featherWidth;
  const featherQueue = new Int32Array(width * height);
  let featherEnd = 0;
  const inFeatherQueue = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx] || inFeatherQueue[idx]) continue;
      const touchesRemoved =
        (x > 0 && visited[idx - 1]) ||
        (x < width - 1 && visited[idx + 1]) ||
        (y > 0 && visited[idx - width]) ||
        (y < height - 1 && visited[idx + width]);
      if (!touchesRemoved) continue;
      inFeatherQueue[idx] = 1;
      featherQueue[featherEnd++] = idx;
    }
  }

  let featherStart = 0;
  while (featherStart < featherEnd) {
    const idx = featherQueue[featherStart++];
    const i = idx * 4;
    const distance = colorDistance(data[i], data[i + 1], data[i + 2], bgR, bgG, bgB);
    if (distance > looseThreshold) continue; // reached genuine item color — stop here

    const alphaRatio = Math.max(0, Math.min(1, (distance - threshold) / featherWidth));
    if (alphaRatio < 0.12) {
      // Close enough to pure background that keeping a sliver of it visible
      // does more harm (a faint but noisy-colored speck — see the division
      // below) than good. Treat it as fully removed instead.
      data[i + 3] = 0;
    } else {
      data[i + 3] = Math.round(alphaRatio * 255);
      // Un-blend: observed = alphaRatio*trueColor + (1-alphaRatio)*bgColor.
      data[i] = clampByte((data[i] - (1 - alphaRatio) * bgR) / alphaRatio);
      data[i + 1] = clampByte((data[i + 1] - (1 - alphaRatio) * bgG) / alphaRatio);
      data[i + 2] = clampByte((data[i + 2] - (1 - alphaRatio) * bgB) / alphaRatio);
    }

    const x = idx % width;
    const y = Math.floor(idx / width);
    const tryEnqueueFeather = (nx: number, ny: number) => {
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) return;
      const nIdx = ny * width + nx;
      if (visited[nIdx] || inFeatherQueue[nIdx]) return;
      inFeatherQueue[nIdx] = 1;
      featherQueue[featherEnd++] = nIdx;
    };
    tryEnqueueFeather(x - 1, y);
    tryEnqueueFeather(x + 1, y);
    tryEnqueueFeather(x, y - 1);
    tryEnqueueFeather(x, y + 1);
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;
  return { minX, minY, maxX, maxY };
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

  // The crop frame is decided separately from the actual pixel removal.
  // Cropping to whatever threshold the caller picked meant the frame's own
  // size rode on how successfully *that* threshold cleared the background
  // — on a photo where the background doesn't fully clear until a looser
  // setting (see the module comment on FEATHER_RATIO), a tighter "Remove
  // less" click left more of the original canvas uncropped, so the item
  // rendered smaller inside it despite nothing about the item changing.
  // Getting a second, independent opinion at the fixed default threshold —
  // discarding its pixels, keeping only its bounding box — means the frame
  // stays the same size across every "Remove more/less" click, and only
  // cutout quality (what's transparent, how clean the edges are) changes.
  // When the caller's threshold *is* the default, that pass already gives
  // us both, so there's no need for a second one.
  let frameBounds: Bounds | null;
  if (threshold === DEFAULT_THRESHOLD) {
    frameBounds = applyRemoval(data, width, height, bgR, bgG, bgB, threshold);
  } else {
    const referenceData = ctx.getImageData(0, 0, width, height).data;
    frameBounds = applyRemoval(referenceData, width, height, bgR, bgG, bgB, DEFAULT_THRESHOLD);
    applyRemoval(data, width, height, bgR, bgG, bgB, threshold);
  }

  ctx.putImageData(imageData, 0, 0);

  if (!frameBounds) {
    // Nothing survived (e.g. a near-uniform photo) — fall back to the
    // uncropped result rather than producing an empty image.
    return canvas.toDataURL("image/png");
  }

  const { minX, minY, maxX, maxY } = frameBounds;
  const boxWidth = maxX - minX + 1;
  const boxHeight = maxY - minY + 1;
  const padding = Math.round(Math.max(boxWidth, boxHeight) * CROP_PADDING_RATIO);
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropWidth = Math.min(width, maxX + padding + 1) - cropX;
  const cropHeight = Math.min(height, maxY + padding + 1) - cropY;

  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;
  const croppedCtx = croppedCanvas.getContext("2d");
  if (!croppedCtx) {
    return canvas.toDataURL("image/png");
  }
  croppedCtx.drawImage(
    canvas,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  return croppedCanvas.toDataURL("image/png");
}
