const express = require('express');
const isAuthenticated = require('../middleware/auth');
const User = require("../models/User");
const UserInfo = require("../models/UserInfo");
const { rooms } = require("../sockets/gameSocket");
const router = express.Router();

router.get('/', (req, res) => res.render('index'));
// router.get('/', isAuthenticated, async (req, res) => {
//   if(!req.session.userId) return res.redirect('/login');

//   const user = await User.findById(req.session.userId);
//   if(!user) return res.redirect('/login');

//   res.render('home', {user : {name: user.username}});
// });



router.get('/dashboard', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  const user = await User.findById(req.session.userId);
  res.render('home', { user: { name: user.username, isLoggedIn: true }, rooms});
});

router.get('/rooms', (req, res) => {
  res.json(rooms);
})


router.get('/create', isAuthenticated, async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render('board', { user: { name: user.username, isLoggedIn: true } });
});

router.get('/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  const userId = req.session.userId;
  const user = await User.findById(userId);
  if (!user) {
    return res.redirect('/login');
  }
  const userInfo = await UserInfo.findOne({ userId: userId });

  // res.render('user/profile', { user });  // it pass whole user object including password.
  res.render('user/profile', { user: { name: user.username, email: user.email, createdAt: user.createdAt, isLoggedIn: true, rating: userInfo.rating, like: userInfo.like, gamesPlayed: userInfo.gamesPlayed, gameWins: userInfo.gamesWins, rank: userInfo.rank } });
});

router.get('/leaderboard', async (req, res) => {
  const limit = 20;
  const usersDatas = req.query.usersData || 1;
  const skip = (usersDatas - 1) * limit;

  try {
    const users = await UserInfo.find().populate('userId').skip(skip).limit(limit).exec();
    // res.json(users);

    // res.render('game/leaderboard', { users: users, currentUsers: usersDatas, limit: limit, isLoggedIn: true });

    res.render('game/leaderboard', {
      users: users.map(user => ({
        currentUsers: usersDatas,
        limit: limit,
        isLoggedIn: true,
        username: user.userId.username,
        rating: user.rating,
        gamesPlayed: user.gamesPlayed,
        gamesWins: user.gamesWins,
    })).sort((a,b)=> b.rating - a.rating),
    });
    // res.json(users.map(user => ({
    //     currentUsers: usersDatas,
    //     limit: limit,
    //     isLoggedIn: true,
    //     username: user.userId.username,
    //     rating: user.rating,
    //     gamesPlayed: user.gamesPlayed,
    //     gamesWins: user.gamesWins,
    //   })));

  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error fetching users for leaderboard.' });
  }

});

module.exports = router;