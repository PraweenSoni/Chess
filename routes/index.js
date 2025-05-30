const express = require('express');
const isAuthenticated = require('../middleware/auth');
const User = require("../models/User");
const UserInfo = require("../models/UserInfo");
const router = express.Router();

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

router.get('/dashboard', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  const user = await User.findById(req.session.userId);
  res.render('home', { user: { name: user.username, isLoggedIn: true } });
});


router.get('/create', isAuthenticated, (req, res) => res.render('board', { user: { isLoggedIn: true}}));

router.get('/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  const userId = req.session.userId;
  const user = await User.findById(userId);
  if (!user) {
    return res.redirect('/login');
  }
  const userInfo = await UserInfo.findOne({userId : userId});

  // res.render('user/profile', { user });  // it pass whole user object including password.
  res.render('user/profile', { user: { name: user.username, email: user.email, createdAt: user.createdAt, isLoggedIn: true, rating: userInfo.rating, like: userInfo.like, gamesPlayed: userInfo.gamesPlayed, gameWins: userInfo.gamesWins, rank: userInfo.rank}});
});

router.get('/leaderboard', (req, res) => res.render('game/leaderboard', { user: { isLoggedIn: true } }));

module.exports = router;