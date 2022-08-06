const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  code: {
    type: String,
    // unique: true,
  },
  roomId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'room',
    default:null
  }
});

module.exports =  new mongoose.model("user", userSchema);
