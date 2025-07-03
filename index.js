
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const getColors = require('get-image-colors');
const { createGradientBackground } = require('./utils/generateBackground');

const app = express();
const upload = multer({ dest: 'uploads/' });

const PORT = process.env.PORT || 3000;
const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

app.use('/output', express.static(OUTPUT_DIR));

app.post('/process', upload.single('file'), async (req, res) => {
  try {
    const inputPath = req.file.path;
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    const colors = await getColors(inputPath);
    const dominant = colors[0].hex();
    const bgColor = '#d7810e80';

    const bgBuffer = await createGradientBackground(1000, 700, dominant, bgColor);

    const resized = await image
      .resize({
        width: 1000,
        height: 700,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

    const composite = await sharp(bgBuffer)
      .composite([{ input: resized, gravity: 'center' }])
      .png()
      .toBuffer();

    const filename = 'img_' + Date.now() + '.png';
    const outPath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(outPath, composite);
    fs.unlinkSync(inputPath);

    res.json({
      status: 'ok',
      result: {
        url: req.protocol + '://' + req.get('host') + '/output/' + filename
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Processing failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
