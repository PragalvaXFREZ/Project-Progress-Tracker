const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authMiddleware = require('./middleware/auth');

// Add JWT secret key
global.JWT_SECRET = '8afbcddc58157dcbb8bfb1817dcb423c962c8acec7991f650137b9b23f9acc1c'; // Replace with a strong random string

require('./Models/User');
require('./Models/Project');
require('./Models/Task');

const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/project');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Error handling middleware
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

// Routes with correct order
app.use('/api', authRoutes);
app.use('/api/projects', authMiddleware);
app.use('/api/projects', projectRoutes);
app.use('/api', require('./routes/taskRoutes')); 
app.use('/api/users', userRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});