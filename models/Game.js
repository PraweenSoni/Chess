const mongoose = require("mongoose");

const GameSchema = new mongoose.Schema({
  playerWhite: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  playerBlack: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  moves: [{ type: String }], // Algebraic notation
  boardState: { type: String },
  status: { type: String, enum: ["ongoing", "completed", "aborted"], default: "ongoing" },
  result: { type: String, enum: ["white_win", "black_win", "draw", "undecided"], default: "undecided" }
});

module.exports = mongoose.model("Game", GameSchema);