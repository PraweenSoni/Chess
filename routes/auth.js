const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const UserInfo = require('../models/UserInfo');

const router = express.Router();

router.get('/login', (req, res) => res.render('auth/login', { error: null }));
router.get('/signup', (req, res) => res.render('auth/signup', { error: null }));

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.render('auth/login', { error: 'Invalid credentials' });
  }
  req.session.userId = user._id;
  res.redirect('/dashboard');
});

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.redirect('/login');
  } catch (error) {
    res.render('auth/signup', { error: error.message });
  }
});

module.exports = router;