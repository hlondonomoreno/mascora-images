// index.js con logging detallado para depurar
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { createGradientBackground } = require("./utils/generateBackground");

const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = process.env.PORT || 3000;

app.post("/process", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      console.error("No se recibió ningún archivo.");
      return res.status(400).json({ status: "error", message: "No file uploaded" });
    }

    console.log("Archivo recibido:", req.file.originalname);

    const originalPath = req.file.path;
    const outputDir = path.join(__dirname, "output");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const outputFile = `img_${Date.now()}.png`;
    const outputPath = path.join(outputDir, outputFile);

    const WIDTH = 1000;
    const HEIGHT = 700;
    const BACKGROUND_COLOR = "#d7810e80";

    console.log("Procesando imagen con sharp...");
    const image = sharp(originalPath);
    const metadata = await image.metadata();
    console.log("Metadata de la imagen:", metadata);

    const resized = await image
      .resize(WIDTH, HEIGHT, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    console.log("Generando fondo degradado...");
    const background = await createGradientBackground(WIDTH, HEIGHT, "#ffffff", BACKGROUND_COLOR);

    console.log("Combinando imagen con fondo...");
    const composite = await sharp(background)
      .composite([{ input: resized, gravity: "center" }])
      .png()
      .toFile(outputPath);

    console.log("Imagen final guardada en:", outputPath);

    const finalUrl = `${req.protocol}://${req.get("host")}/output/${outputFile}`;
    res.json({ status: "ok", result: { url: finalUrl } });
  } catch (err) {
    console.error("Error durante el procesamiento:", err);
    res.status(500).json({ status: "error", message: "Processing failed." });
  }
});

app.use("/output", express.static(path.join(__dirname, "output")));

app.get("/", (req, res) => {
  res.send("Microservicio de procesamiento de imágenes activo.");
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

