const express = require('express');
const DTR = require('../models/DTR');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied, no token provided' });
  }

  try {
    const tokenParts = token.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return res.status(400).json({ error: 'Invalid token format' });
    }

    const decoded = jwt.verify(tokenParts[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid Token' });
  }
};

// Get today's DTR status
router.get('/today/:username', verifyToken, async (req, res) => {
  try {
    const { username } = req.params;
    const today = new Date().toLocaleDateString();
    
    const dtr = await DTR.findOne({ username, date: today });
    if (!dtr) {
      return res.json(null);
    }
    
    res.json(dtr);
  } catch (err) {
    console.error('Error fetching today\'s DTR:', err);
    res.status(500).json({ error: 'Failed to fetch DTR status' });
  }
});

// Time In
router.post('/time-in', verifyToken, async (req, res) => {
  try {
    const { username, role, selfieIn } = req.body;
    const today = new Date().toLocaleDateString();
    const timeIn = new Date().toLocaleTimeString();

    // Check if user already has a time-in for today
    const existingDTR = await DTR.findOne({ 
      username, 
      date: today,
      timeIn: { $exists: true }
    });

    if (existingDTR) {
      return res.status(400).json({ error: 'You have already timed in today' });
    }

    // Create new DTR record for today
    const dtr = new DTR({ 
      username,
      role,
      date: today,
      timeIn,
      selfieIn
    });
    
    await dtr.save();
    res.json(dtr);
  } catch (err) {
    console.error('Time In error:', err);
    res.status(500).json({ error: 'Failed to save time in' });
  }
});

// Time Out
router.post('/time-out', verifyToken, async (req, res) => {
  try {
    const { username, selfieOut } = req.body;
    const today = new Date().toLocaleDateString();
    const timeOut = new Date().toLocaleTimeString();

    const dtr = await DTR.findOneAndUpdate(
      { 
        username, 
        date: today,
        timeIn: { $exists: true },
        timeOut: { $exists: false }
      },
      { timeOut, selfieOut },
      { new: true }
    );

    if (!dtr) {
      return res.status(404).json({ error: 'No Time In record found for today or you have already timed out.' });
    }

    res.json(dtr);
  } catch (err) {
    console.error('Time Out error:', err);
    res.status(500).json({ error: 'Failed to save time out' });
  }
});

module.exports = router;
