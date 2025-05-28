const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rating: { type: Number, default: 1200 },
  profilePicture: { type: String, default: "" },
  status: { type: String, enum: ["online", "offline"], default: "offline" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);
