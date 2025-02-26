const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
});

// Use 'User' (uppercase) consistently and prevent recompilation
module.exports = mongoose.models.User || mongoose.model('User', userSchema);