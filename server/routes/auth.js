const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Project = require('../Models/Project');

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        
        res.status(200).json({
            message: 'Login successful',
            userId: user._id,
            isAdmin: user.isAdmin
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Signup route
router.post('/signup', async (req, res) => {
    try {
        const { email, password, isAdmin } = req.body;
        
        // Check if user already exists
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create new user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ 
            email, 
            password: hashedPassword, 
            isAdmin 
        });
        await newUser.save();

        // Check for pending invites
        const projectsWithInvite = await Project.find({ 
            'pendingInvites.email': email 
        });

        // Add user to these projects
        for (let project of projectsWithInvite) {
            project.members.push(newUser._id);
            project.pendingInvites = project.pendingInvites.filter(invite => 
                invite.email !== email
            );
            await project.save();
        }

        res.status(201).json({ 
            message: 'User registered successfully',
            userId: newUser._id
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Error registering user' });
    }
});

module.exports = router;