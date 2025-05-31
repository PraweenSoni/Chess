const mongoose = require("mongoose");

const UserInfoSchema = new mongoose.Schema({
  userId : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, default: 100 },
  profilePicture: { type: String, default: "" },
  like: { type: Number, default: 0},
  gamesPlayed: { type: Number, default: 0},
  gamesWins: { type: Number, default: 0},
  country: { type: String, default: ""},
  rank: { type: Number, default: 0},
});

module.exports = mongoose.model("UserInfo", UserInfoSchema);
