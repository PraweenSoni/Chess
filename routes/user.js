const express = require("express");
const User = require("../models/User");
const UserInfo = require("../models/UserInfo");

const router = express.Router();

router.get('/profile/:username', async (req, res) => {
  const username = req.params.username;

  const user = await User.findOne({ username: username });
  const userInfo = await UserInfo.findOne({ userId: user._id });

  if (!user) {
    res.status(400).send('usernmae is required!! Or user will not avaliable');
  } else {
    res.render('user/userprofile', {
      user: {
        username: user.username,
        createdAt: user.createdAt,
        isLoggedIn: false,
      },
      userInfo
    });
  }
});

module.exports = router;