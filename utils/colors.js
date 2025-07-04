const { createCanvas } = require('canvas');

function hexToRgb(hex) {
  const bigint = parseInt(hex.replace('#', ''), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

async function createGradientBackground(width, height, fromColor, toColor) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const [r1, g1, b1] = hexToRgb(fromColor);
  const [r2, g2, b2] = hexToRgb(toColor);

  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height)
  );

  gradient.addColorStop(0, `rgba(${r1},${g1},${b1},1)`);
  gradient.addColorStop(1, `rgba(${r2},${g2},${b2},1)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas.toBuffer('image/png');
}

module.exports = { createGradientBackground };
