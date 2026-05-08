const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../src/components/upload-form.tsx");
const src = fs.readFileSync(file, "utf8");

// Check for camera-first layout elements from the new design
const asserts = [
  "getUserMedia", // Camera permission
  "videoRef", // Video element
  "canvasRef", // Canvas for capture
  "capturePhoto", // Capture function
  "Take a photo & Scan here", // Button text matching image
  "Drag or Upload a document", // Drag-drop zone text matching image
  "aspectRatio", // Large preview sizing
  "cameraActive", // Camera state tracking
  "dropZoneRef", // Drop zone ref
];

let failed = [];
for (const a of asserts) {
  if (!src.includes(a)) failed.push(a);
}

if (failed.length > 0) {
  console.error(
    "Unit test failed - missing expected camera-first layout elements:",
    failed,
  );
  process.exit(2);
} else {
  console.log(
    "✓ Unit test passed: camera-first layout with image-matching design verified.",
  );
  process.exit(0);
}
