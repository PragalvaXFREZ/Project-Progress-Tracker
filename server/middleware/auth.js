const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Auth Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, global.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    // Set the entire decoded object as req.user
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      details: error.message
    });
  }
};