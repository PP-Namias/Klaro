const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/components/upload-form.tsx');
const src = fs.readFileSync(file, 'utf8');

const asserts = [
  'getUserMedia',
  'videoRef',
  'canvasRef',
  'Capture',
  'toDataURL'
];

let failed = [];
for (const a of asserts) {
  if (!src.includes(a)) failed.push(a);
}

if (failed.length > 0) {
  console.error('Unit test failed - missing expected camera code pieces:', failed);
  process.exit(2);
} else {
  console.log('Unit test passed: camera-first UploadForm contains expected code.');
  process.exit(0);
}
