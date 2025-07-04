// index.js
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());

const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

app.post('/process', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded.' });
    }

    const originalImage = sharp(req.file.buffer);
    const metadata = await originalImage.metadata();

    const outputWidth = 1000;
    const outputHeight = 700;

    // Resize main image to fit inside the canvas
    const resizedImageBuffer = await originalImage
      .resize({ width: outputWidth - 200, height: outputHeight - 200, fit: 'inside' })
      .toBuffer();

    // Create a blurred version of the image for background
    const blurredBackground = await originalImage
      .resize({ width: outputWidth, height: outputHeight, fit: 'cover' })
      .blur(50)
      .toBuffer();

    // Apply a semi-transparent overlay to match the app background color
    const overlayColor = '#ea8f07';
    const backgroundOverlay = Buffer.from(
      `<svg width="${outputWidth}" height="${outputHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${overlayColor}" fill-opacity="0.2"/>
      </svg>`
    );

    const backgroundWithOverlay = await sharp(blurredBackground)
      .composite([{ input: backgroundOverlay, blend: 'over' }])
      .toBuffer();

    // Composite final image
    const finalImage = await sharp(backgroundWithOverlay)
      .composite([{
        input: resizedImageBuffer,
        top: Math.round((outputHeight - metadata.height) / 2),
        left: Math.round((outputWidth - metadata.width) / 2),
      }])
      .jpeg()
      .toBuffer();

    const filename = `processed_${Date.now()}.jpg`;
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, finalImage);

    return res.json({ status: 'success', url: `${req.protocol}://${req.get('host')}/output/${filename}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Processing failed.' });
  }
});

app.use('/output', express.static(path.join(__dirname, 'output')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

