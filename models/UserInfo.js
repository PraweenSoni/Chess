const mongoose = require("mongoose");

const UserInfoSchema = new mongoose.Schema({
  userId : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, default: 100 },
  profilePicture: { type: String, default: "" },
  gamesPlayed: { type: Number, default: 0},
  gamesWins: { type: Number, default: 0},
  country: { type: String, dafault: ""},
  like: { type: Number, dafault: 0},
  rank: { type: Number, dafault: 0},
});

module.exports = mongoose.model("UserInfo", UserInfoSchema);
