const express = require('express');
const isAuthenticated = require('../middleware/auth');
const User = require("../models/User");
const router = express.Router();

// router.get('/dashboard', isAuthenticated, (req, res) => res.render('home'));
router.get('/', (req, res) => res.render('index'));
// router.get('/', isAuthenticated, async (req, res) => {
//   if(!req.session.userId) return res.redirect('/login');

//   const user = await User.findById(req.session.userId);
//   if(!user) return res.redirect('/login');

//   res.render('home', {user : {name: user.username}});
// });

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

router.get('/create', isAuthenticated, (req, res) => res.render('board', { title: 'Chess game' }));

router.get('/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  const user = await User.findById(req.session.userId);
  if (!user) {
    return res.redirect('/login');
  }

  // res.render('user/profile', { user });  // it pass whole user object including password.
  res.render('user/profile', { user: { name: user.username, email: user.email, createdAt: user.createdAt} });
});

router.get('/leaderboard', (req, res) => res.render('game/leaderboard'));

module.exports = router;