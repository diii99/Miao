/**
 * Generates dynamic realistic Miao batik textile textures from the user's hand-drawn canvas.
 * Renders authentic indigo dye absorption, wax-resist white patterns, and traditional ice crackles (冰纹).
 */

export function generateDyedBatikCanvas(
  sourceCanvas: HTMLCanvasElement,
  dyePasses: number = 1,
  oxidationRatio: number = 100 // 0 to 100
): HTMLCanvasElement {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const outCanvas = document.createElement("canvas");
  outCanvas.width = width;
  outCanvas.height = height;
  const ctx = outCanvas.getContext("2d")!;

  // 1. Calculate base background dye color based on passes and oxidation
  // When freshly taken out (oxidation 0), it is vegetal lime green (#4a7a40)
  // When oxidized (oxidation 100), it becomes deep indigo blue based on passes
  const indigoTones = [
    { r: 38, g: 82, b: 122 }, // 1 pass: Sky / Cerulean Indigo
    { r: 22, g: 57, b: 92 },  // 2 passes: Deep Ocean Indigo
    { r: 13, g: 35, b: 60 },  // 3 passes: Midnight Miao Indigo
  ];
  const targetTone = indigoTones[Math.min(dyePasses - 1, indigoTones.length - 1)] || indigoTones[0];
  const greenTone = { r: 74, g: 122, b: 64 }; // Fresh out of vat green

  const ox = Math.min(1, Math.max(0, oxidationRatio / 100));
  const curR = Math.round(greenTone.r + (targetTone.r - greenTone.r) * ox);
  const curG = Math.round(greenTone.g + (targetTone.g - greenTone.g) * ox);
  const curB = Math.round(greenTone.b + (targetTone.b - greenTone.b) * ox);

  // Fill dyed background
  ctx.fillStyle = `rgb(${curR}, ${curG}, ${curB})`;
  ctx.fillRect(0, 0, width, height);

  // Add subtle cloth fiber & weave texture
  ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
  for (let x = 0; x < width; x += 3) {
    ctx.fillRect(x, 0, 1, height);
  }
  for (let y = 0; y < height; y += 3) {
    ctx.fillRect(0, y, width, 1);
  }

  // 2. Read source canvas wax mask
  const srcCtx = sourceCanvas.getContext("2d")!;
  const srcImgData = srcCtx.getImageData(0, 0, width, height);
  const srcData = srcImgData.data;

  const outImgData = ctx.getImageData(0, 0, width, height);
  const outData = outImgData.data;

  // 3. Composite wax resist areas into clean off-white / cream linen color
  // Waxed pixels in source canvas deviate from raw linen #eee5d4
  for (let i = 0; i < srcData.length; i += 4) {
    const sr = srcData[i];
    const sg = srcData[i + 1];
    const sb = srcData[i + 2];

    // Check if painted with amber wax (darker or saturated compared to raw linen)
    const isWaxed = sr < 205 || sg < 185 || sb < 155;
    if (isWaxed) {
      // Natural wax-resist white cotton color
      outData[i] = 242;     // R
      outData[i + 1] = 238; // G
      outData[i + 2] = 228; // B
      outData[i + 3] = 255; // A
    }
  }
  ctx.putImageData(outImgData, 0, 0);

  // 4. Procedural Ice Crackles (冰裂纹)
  // Fine random dye cracks permeating the wax-resist pattern
  ctx.save();
  ctx.strokeStyle = `rgba(${curR}, ${curG}, ${curB}, 0.55)`;
  ctx.lineWidth = 1.0;
  for (let c = 0; c < 28; c++) {
    const startX = Math.random() * width;
    const startY = Math.random() * height;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    let px = startX;
    let py = startY;
    for (let seg = 0; seg < 5; seg++) {
      px += (Math.random() - 0.5) * 60;
      py += (Math.random() - 0.5) * 60;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();

  return outCanvas;
}
