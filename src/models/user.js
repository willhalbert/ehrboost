const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");
const CreditCard = require("./creditCard");
const PremiumProvider = require("./premiumProvider");
const Receipt = require("./receipt");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: false,
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is invalid");
        }
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 7,
      trim: true,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error('Password cannot contain "password"');
        }
      },
    },
    primaryUse: {
      type: String,
      required: false,
      trim: true,
    },
    organization: {
      type: String,
      required: false,
      trim: true,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});

userSchema.virtual("creditCards", {
  ref: "CreditCard",
  localField: "_id",
  foreignField: "owner",
});

// Virtual property for Premium Providers
userSchema.virtual("premiumProviders", {
  ref: "PremiumProvider",
  localField: "_id",
  foreignField: "owner",
});

// Virtual property for Receipts
userSchema.virtual("receipts", {
  ref: "Receipt",
  localField: "_id",
  foreignField: "owner",
});

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  return userObject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: "4 hours",
  });
  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Unable to login");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Unable to login");
  }

  return user;
};

// Hash the plain text password before saving
userSchema.pre("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

// Delete user tasks when user is removed
userSchema.pre("remove", async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
/*
,
    countryOfOrigin: {
      type: String,
      required: true,
      trim: true,
    },
    currentPlan: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      required: true,
      trim: true,
      enum: ["male", "female", "other"],
    },
    dateOfBirth: {
      day: {
        type: Number,
        required: true,
        min: 1,
        max: 31,
      },
      month: {
        type: Number,
        required: false,
        min: 1,
        max: 12,
      },
      year: {
        type: Number,
        required: false,
        min: 1900,
      },
    },*/
