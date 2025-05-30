const mongoose = require("mongoose");
const UserInfo = require("./UserInfo");

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  status: { type: String, enum: ["online", "offline"], default: "offline" },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.post('save', async function(doc) {
  try {
    const userInfo = new UserInfo({userId: doc._id});
    await userInfo.save();
  } catch (error) {
    console.error(error);
  }
})

module.exports = mongoose.model("User", UserSchema);
