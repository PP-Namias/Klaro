const express = require("express");
const scanRoute = require("./routes/scan");
const ocrRoute = require("./routes/ocr");

try {
  require("dotenv").config();
} catch (err) {
  console.warn(
    "dotenv not available; continuing without environment file loading",
  );
}

let morgan;
try {
  morgan = require("morgan");
} catch (err) {
  morgan = () => (_req, _res, next) => next();
}

const app = express();
app.use(morgan('dev'));
// The scan route accepts base64 images up to MAX_BASE64_SIZE (10MB decoded).
// body-parser defaults to 100kb, which rejected every real photograph before
// the route could run. 15mb covers 10MB plus base64's ~33% overhead; oversized
// payloads are still rejected by the route's own check with 'file_too_large'.
app.use(express.json({ limit: '15mb' }));

app.use("/api", scanRoute);
app.use("/api", ocrRoute);

// simple health
app.get("/health", (req, res) => res.json({ status: "ok" }));

if (require.main === module) {
  const port = process.env.PORT || 3001;
  app.listen(port, () =>
    console.log(`gemini-scan-backend listening on ${port}`),
  );
}

module.exports = app;
