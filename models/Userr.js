const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  emotion: {
    type: [String],
  },
});

module.exports = mongoose.model("Userr", userSchema);
