const express = require('express');
const isAuthenticated = require('../middleware/auth');
const User = require("../models/User");
const UserInfo = require("../models/UserInfo");
const { rooms } = require("../sockets/gameSocket");
const router = express.Router();

router.get('/', (req, res) => res.render('index'));

router.get('/dashboard', isAuthenticated, async (req, res) => {
  if(!req.session.userId) return res.redirect('/login');

  const user = await User.findById(req.session.userId);
  if(!user) return res.redirect('/login');

  res.render('home', {user : {name: user.username}, rooms});
});

router.get('/rooms', (req, res) => {
  res.json(rooms);
})


router.get('/create', isAuthenticated, async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render('board', { user: { name: user.username, id: user._id.toString(), isLoggedIn: true } });
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
  res.render('user/profile', { user: { name: user.username, email: user.email, createdAt: user.createdAt, isLoggedIn: true, rating: userInfo.rating, like: userInfo.like, gamesPlayed: userInfo.gamesPlayed, gameWins: userInfo.gamesWins, country: userInfo.country, rank: userInfo.rank } });
  // Better way
  // res.render('profile', {
  //   user: {
  //     username: user.username,
  //     email: user.email
  //   },
  //   userInfo
  // });
});

router.post('/profile', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const { country } = req.body;

  try {
    await UserInfo.findOneAndUpdate(
      { userId: req.session.userId },
      { country },
      { upsert: true } // create if not exists
    );

    res.redirect('/profile');
  } catch (err) {
    console.error("Country update failed:", err);
    res.status(500).send("Something went wrong.");
  }
});


router.get('/leaderboard', async (req, res) => {
  const limit = 20;
  const usersDatas = req.query.usersData || 1;
  const skip = (usersDatas - 1) * limit;

  let userLoggedIn = false;
  if (req.session.userId){
    userLoggedIn = true;
  }
  try {
    const users = await UserInfo.find().populate('userId').skip(skip).limit(limit).exec();
    
    res.render('game/leaderboard', {
      users: users.map(user => ({
        currentUsers: usersDatas,
        limit: limit,
        username: user.userId.username,
        country : user.country,
        rating: user.rating,
        gamesPlayed: user.gamesPlayed,
        gamesWins: user.gamesWins,
      })).sort((a,b)=> b.rating - a.rating),
      isLoggedIn: userLoggedIn,
    });
    
    // res.json(users);
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