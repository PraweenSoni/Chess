const express = require("express");
const User = require("../models/User");

const router = express.Router();

router.get('/profile/:username',async (req, res) => {
  const username = req.params.username;

  const user = await User.findOne({username : username});
  // if (!user) {
  //   return res.redirect('/login');
  // }
  
  if(!user){
    res.status(400).send('usernmae is required!! Or user will not avaliable');
  }else{
    res.render('user/profile', { user: { name: user.username, createdAt: user.createdAt} });
  }
});

module.exports = router;