const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const openApiPath = path.join(root, 'openapi.yaml');
const outDir = path.join(root, 'postman');
const outPath = path.join(outDir, 'gemini-scan-backend.collection.json');

const openApiText = fs.readFileSync(openApiPath, 'utf8');
const titleMatch = openApiText.match(/^\s*title:\s*(.+)$/mi);
const versionMatch = openApiText.match(/^\s*version:\s*['"]?(.+?)['"]?\s*$/mi);

const collection = {
  info: {
    name: titleMatch?.[1]?.trim() || 'Gemini Scan Backend',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    description: `Generated from ${path.basename(openApiPath)}${versionMatch?.[1] ? ` v${versionMatch[1].trim()}` : ''}`
  },
  variable: [
    { key: 'baseUrl', value: 'http://127.0.0.1:3001' },
    { key: 'scanId', value: 'sample-scan' },
    { key: 'sampleFilePath', value: path.join(root, 'tests', 'fixtures', 'sample.jpg') }
  ],
  item: [
    {
      name: 'Scan image',
      request: {
        method: 'POST',
        header: [{ key: 'Accept', value: 'application/json' }],
        url: '{{baseUrl}}/api/scan',
        body: {
          mode: 'formdata',
          formdata: [
            { key: 'file', type: 'file', src: '{{sampleFilePath}}' },
            { key: 'metadata', type: 'text', value: JSON.stringify({ requestId: 'sample-scan', task: 'extract_invoice_fields', language: 'en' }) }
          ]
        }
      }
    },
    {
      name: 'Get scan result',
      request: {
        method: 'GET',
        header: [{ key: 'Accept', value: 'application/json' }],
        url: '{{baseUrl}}/api/scan/{{scanId}}'
      }
    }
  ]
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(collection, null, 2));
console.log(`Wrote ${outPath}`);
