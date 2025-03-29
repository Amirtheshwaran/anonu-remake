const express = require('express');
const cors = require('cors');
const path = require('path');
const { json, urlencoded } = require('express');
const config = require('./config/config');

// Initialize Express
const app = express();

// Middleware
app.use(json({ extended: false }));
app.use(urlencoded({ extended: false }));
app.use(cors({
  origin: config.clientUrl,
  credentials: true
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/messages', require('./routes/messages'));

// Serve static assets in production
if (config.nodeEnv === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Server Error',
    error: config.nodeEnv === 'development' ? err.message : undefined
  });
});

const PORT = config.port;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// For testing
module.exports = app;
