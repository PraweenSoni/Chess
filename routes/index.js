const express = require('express');
const isAuthenticated = require('../middleware/auth');
const User = require("../models/User");
const UserInfo = require("../models/UserInfo");
const { rooms } = require("../sockets/gameSocket");
const router = express.Router();

const countryMap = {
  us: { flag: "🇺🇸", name: "United States" },
  gb: { flag: "🇬🇧", name: "United Kingdom" },
  in: { flag: "🇮🇳", name: "India" },
  ca: { flag: "🇨🇦", name: "Canada" },
  au: { flag: "🇦🇺", name: "Australia" },
  de: { flag: "🇩🇪", name: "Germany" },
  fr: { flag: "🇫🇷", name: "France" },
  jp: { flag: "🇯🇵", name: "Japan" },
  cn: { flag: "🇨🇳", name: "China" },
  ru: { flag: "🇷🇺", name: "Russia" },
  br: { flag: "🇧🇷", name: "Brazil" },
  za: { flag: "🇿🇦", name: "South Africa" },
  it: { flag: "🇮🇹", name: "Italy" },
  mx: { flag: "🇲🇽", name: "Mexico" },
  es: { flag: "🇪🇸", name: "Spain" },
  kr: { flag: "🇰🇷", name: "South Korea" },
  sa: { flag: "🇸🇦", name: "Saudi Arabia" },
  tr: { flag: "🇹🇷", name: "Turkey" },
  ar: { flag: "🇦🇷", name: "Argentina" },
  id: { flag: "🇮🇩", name: "Indonesia" },
  nl: { flag: "🇳🇱", name: "Netherlands" },
  se: { flag: "🇸🇪", name: "Sweden" },
  ch: { flag: "🇨🇭", name: "Switzerland" },
  ua: { flag: "🇺🇦", name: "Ukraine" },
  pl: { flag: "🇵🇱", name: "Poland" },
  no: { flag: "🇳🇴", name: "Norway" },
  bd: { flag: "🇧🇩", name: "Bangladesh" },
  pk: { flag: "🇵🇰", name: "Pakistan" },
  ng: { flag: "🇳🇬", name: "Nigeria" },
  th: { flag: "🇹🇭", name: "Thailand" },
  my: { flag: "🇲🇾", name: "Malaysia" },
  sg: { flag: "🇸🇬", name: "Singapore" },
  nz: { flag: "🇳🇿", name: "New Zealand" },
  eg: { flag: "🇪🇬", name: "Egypt" },
  cz: { flag: "🇨🇿", name: "Czech Republic" },
  fi: { flag: "🇫🇮", name: "Finland" },
  dk: { flag: "🇩🇰", name: "Denmark" },
  il: { flag: "🇮🇱", name: "Israel" },
  ph: { flag: "🇵🇭", name: "Philippines" },
  ve: { flag: "🇻🇪", name: "Venezuela" },
  cl: { flag: "🇨🇱", name: "Chile" },
  ie: { flag: "🇮🇪", name: "Ireland" },
  at: { flag: "🇦🇹", name: "Austria" },
  be: { flag: "🇧🇪", name: "Belgium" },
  gr: { flag: "🇬🇷", name: "Greece" },
  pt: { flag: "🇵🇹", name: "Portugal" },
  ro: { flag: "🇷🇴", name: "Romania" },
  hu: { flag: "🇭🇺", name: "Hungary" },
  co: { flag: "🇨🇴", name: "Colombia" },
  vn: { flag: "🇻🇳", name: "Vietnam" }
};

router.get('/', (req, res) => res.render('index'));

router.get('/dashboard', isAuthenticated, async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const user = await User.findById(req.session.userId);
  if (!user) return res.redirect('/login');

  res.render('home', { user: { name: user.username, isLoggedIn: true }, rooms });
});

router.get('/rooms', (req, res) => {
  res.json(rooms);
})


router.get('/create', isAuthenticated, async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render('board', { user: { name: user.username, id: user._id.toString(), isLoggedIn: true } });
});

// router.get('/profile', async (req, res) => {
//   if (!req.session.userId) {
//     return res.redirect('/login');
//   }
//   const userId = req.session.userId;
//   const user = await User.findById(userId);
//   if (!user) {
//     return res.redirect('/login');
//   }
//   const userInfo = await UserInfo.findOne({ userId: userId });

//   // res.render('user/profile', { user });  // it pass whole user object including password.
//   res.render('user/profile', { user: { name: user.username, email: user.email, createdAt: user.createdAt, isLoggedIn: true, rating: userInfo.rating, like: userInfo.like, gamesPlayed: userInfo.gamesPlayed, gameWins: userInfo.gamesWins, country: userInfo.country, rank: userInfo.rank } });
// });

router.get('/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  const userId = req.session.userId;
  const user = await User.findById(userId);
  if (!user) {
    return res.redirect('/login');
  }

  const userInfo = await UserInfo.findOne({ userId });

  res.render('user/profile', {
    user: {
      name: user.username,
      email: user.email,
      createdAt: user.createdAt,
      isLoggedIn: true,
      rating: userInfo.rating,
      like: userInfo.like,
      gamesPlayed: userInfo.gamesPlayed,
      gameWins: userInfo.gamesWins,
      country: userInfo.country,
      rank: userInfo.rank
    },
    countryMap
  });
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
  if (req.session.userId) {
    userLoggedIn = true;
  }
  try {
    const users = await UserInfo.find().populate('userId').skip(skip).limit(limit).exec();

    res.render('game/leaderboard', {
      users: users.map(user => ({
        currentUsers: usersDatas,
        limit: limit,
        username: user.userId.username,
        country: user.country,
        rating: user.rating,
        gamesPlayed: user.gamesPlayed,
        gamesWins: user.gamesWins,
      })).sort((a, b) => b.rating - a.rating),
      countryMap,
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