const express = require('express');
const scanRoute = require('./routes/scan');

try {
  require('dotenv').config();
} catch (err) {
  console.warn('dotenv not available; continuing without environment file loading');
}

let morgan;
try {
  morgan = require('morgan');
} catch (err) {
  morgan = () => (_req, _res, next) => next();
}

const app = express();
app.use(morgan('dev'));
app.use(express.json());

app.use('/api', scanRoute);

// simple health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

if (require.main === module) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => console.log(`gemini-scan-backend listening on ${port}`));
}

module.exports = app;
