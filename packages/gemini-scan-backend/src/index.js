require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const scanRoute = require('./routes/scan');

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
