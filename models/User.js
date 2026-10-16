const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    salt:{
      type: String,
    },

    profileImageURL:{
      type: String,
      default: '/public/images/default.jpg',
    },

    role:{
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    }
  },
  {
    timestamps: true,
  }
);


// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});


// exports the model
const User = mongoose.model("User", userSchema);

module.exports = User;
