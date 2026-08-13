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
const FEATHER_WIDTH = 30;
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

  // TEMPORARY debug instrumentation — remove once the black-outline bug is
  // confirmed fixed. Answers "is the feather/defringe pass even reaching
  // these pixels, and if so, why isn't it correcting them enough."
  console.log("[removeBackground debug] sampled background color:", {
    r: Math.round(bgR),
    g: Math.round(bgG),
    b: Math.round(bgB),
  });
  console.log(
    `[removeBackground debug] primary fill removed ${queueEnd} / ${width * height} pixels (threshold ${threshold})`
  );

  // Soften the hard flood-fill boundary, and defringe it. A pixel right at
  // the edge of the removed region is usually a color *blend* of the item
  // and the original background (ordinary photo antialiasing, or blur from
  // the MAX_DIMENSION downscale above) — not cleanly one or the other, and
  // that blend can be several pixels wide, not just one. This is a second
  // flood fill, seeded from the boundary of the region already removed
  // above, using a looser color threshold. Same connectivity-respecting
  // design as the primary fill (it can only extend outward from pixels
  // already known to be background, never jump into a same-colored patch
  // in the middle of the item), so it correctly follows a blend band of
  // any width instead of only ever reaching one pixel deep — which is what
  // previously left a ring of un-softened, background-tinted pixels around
  // items shot against a strong background color (reported as a dark
  // outline on a black-background photo).
  //
  // Softening alpha alone isn't enough, though: a pixel that's 60%
  // background/40% item still *stores* that background-tinted color, so at
  // 40% opacity it still reads as a grey/dark fringe once composited onto a
  // page background that isn't the original photo's background (Photoshop
  // calls this "matte" fringing). So each pixel here also gets its RGB
  // corrected — un-blended against the sampled background color — to
  // recover the item's actual color, the same idea as Photoshop's
  // Defringe/Remove Black Matte.
  const looseThreshold = threshold + FEATHER_WIDTH;
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

  // TEMPORARY debug instrumentation, see note above.
  const immediateSeedCount = featherEnd;
  let featherAccepted = 0;
  let featherSnappedZero = 0;
  let featherRecolored = 0;
  let featherRejected = 0;
  let rejectedDistSum = 0;
  let rejectedDistMin = Infinity;
  let rejectedDistMax = -Infinity;

  let featherStart = 0;
  while (featherStart < featherEnd) {
    const idx = featherQueue[featherStart++];
    const i = idx * 4;
    const distance = colorDistance(
      data[i],
      data[i + 1],
      data[i + 2],
      bgR,
      bgG,
      bgB
    );
    if (distance > looseThreshold) {
      // reached genuine item color — stop here
      featherRejected++;
      rejectedDistSum += distance;
      if (distance < rejectedDistMin) rejectedDistMin = distance;
      if (distance > rejectedDistMax) rejectedDistMax = distance;
      continue;
    }

    const alphaRatio = Math.max(
      0,
      Math.min(1, (distance - threshold) / FEATHER_WIDTH)
    );
    featherAccepted++;
    if (alphaRatio < 0.12) {
      // Close enough to pure background that keeping a sliver of it visible
      // does more harm (a faint but noisy-colored speck — see the division
      // below) than good. Treat it as fully removed instead.
      data[i + 3] = 0;
      featherSnappedZero++;
    } else {
      data[i + 3] = Math.round(alphaRatio * 255);
      // Un-blend: observed = alphaRatio*trueColor + (1-alphaRatio)*bgColor.
      data[i] = clampByte((data[i] - (1 - alphaRatio) * bgR) / alphaRatio);
      data[i + 1] = clampByte(
        (data[i + 1] - (1 - alphaRatio) * bgG) / alphaRatio
      );
      data[i + 2] = clampByte(
        (data[i + 2] - (1 - alphaRatio) * bgB) / alphaRatio
      );
      featherRecolored++;
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

  // TEMPORARY debug instrumentation, see note above.
  console.log(
    `[removeBackground debug] feather pass: ${immediateSeedCount} pixels touched the removed region directly, ${featherEnd} considered in total once the pass expanded`
  );
  console.log(
    `[removeBackground debug] feather pass: accepted ${featherAccepted} (snapped fully transparent: ${featherSnappedZero}, recolored: ${featherRecolored}) — rejected ${featherRejected} as too far from the sampled background (loose threshold ${looseThreshold})`
  );
  if (featherRejected > 0) {
    console.log(
      `[removeBackground debug] rejected pixels' distance from sampled background — min ${rejectedDistMin.toFixed(1)}, avg ${(rejectedDistSum / featherRejected).toFixed(1)}, max ${rejectedDistMax.toFixed(1)}`
    );
  }

  // Crop to the item's actual bounding box (any pixel left with meaningful
  // opacity), not the original photo's canvas. Two photos of the same item
  // shot at different distances/crops would otherwise end up rendering at
  // different apparent sizes even after background removal, since a plain
  // "fit the photo in the frame" scale has no idea how much of each photo
  // was actually the item versus empty space around it.
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

  ctx.putImageData(imageData, 0, 0);

  if (maxX < minX || maxY < minY) {
    // Nothing survived (e.g. a near-uniform photo) — fall back to the
    // uncropped result rather than producing an empty image.
    return canvas.toDataURL("image/png");
  }

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
