const express = require("express");
const Game = require("../models/Game");

const router = express.Router();

router.get('/room/:id',async (req, res) => {
  const id = req.params.id;

  const gameId = await Game.findOne(id);
  
  if(!gameId){
    res.status(400).send('This game Id ither finished or id will not correct!!');
  }else{
    res.render('board');
  }
});

module.exports = router;