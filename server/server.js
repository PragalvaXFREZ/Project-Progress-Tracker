const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('./Models/User');
require('./Models/Project');
require('./Models/Task');

const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/project');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Add this before your routes
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something broke!',
    details: err.message 
  });
});

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/project', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB', err);
});

// Routes
app.use('/api', authRoutes);
app.use('/api/projects', require('./routes/project'));
app.use('/api', require('./routes/taskRoutes')); 

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});