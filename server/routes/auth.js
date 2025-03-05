const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../Models/User');
const Project = require('../Models/Project');
const jwt = require('jsonwebtoken');

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user || !await user.comparePassword(password)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Create JWT token with user information
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email,
                isAdmin: user.isAdmin 
            },
            global.JWT_SECRET, // Changed from process.env.JWT_SECRET
            { expiresIn: '24h' }
        );

        // Send response with token and user data
        res.json({
            token,
            userId: user._id,
            email: user.email,
            isAdmin: user.isAdmin
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Signup route
router.post('/signup', async (req, res) => {
    try {
        const { email, password, isAdmin } = req.body;
        
        // Check if user already exists
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ 
            email, 
            password: hashedPassword, 
            isAdmin 
        });
        await newUser.save();

        // Create JWT token for new user
        const token = jwt.sign(
            { 
                userId: newUser._id, 
                email: newUser.email,
                isAdmin: newUser.isAdmin 
            },
            global.JWT_SECRET, // Changed from process.env.JWT_SECRET
            { expiresIn: '24h' }
        );

        // Handle pending project invites
        const projectsWithInvite = await Project.find({ 
            'pendingInvites.email': email 
        });

        for (let project of projectsWithInvite) {
            project.members.push(newUser._id);
            project.pendingInvites = project.pendingInvites.filter(invite => 
                invite.email !== email
            );
            await project.save();
        }

        // Send response with token and user data
        res.status(201).json({ 
            message: 'User registered successfully',
            token,
            userId: newUser._id,
            email: newUser.email,
            isAdmin: newUser.isAdmin
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
});

// Verify token route (optional but useful)
router.get('/verify-token', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, global.JWT_SECRET); // Changed from process.env.JWT_SECRET
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            userId: user._id,
            email: user.email,
            isAdmin: user.isAdmin
        });
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
});

module.exports = router;