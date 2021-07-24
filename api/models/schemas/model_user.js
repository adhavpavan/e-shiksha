'use strict';
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },

  lastName: {
    type: String,
  },
  userType: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },

  mobile: {
    type: Number,
  },
  password: {
    type: String,
    required: true,
  },

  passwordAttempts: {
    type: Number,
    default: 0,
  },

  oldPasswords: {
    type: Array,
  },
  forgotPasswordToken: {
    type: Boolean,
    default: false,
  },
  passwordInvalidated: {
    type: Boolean,
    default: false,
  },
  expires: {
    type: Date,
  },
  passwordUpdated: {
    type: Date,
    default: new Date(),
  },
  securityQuestions: [
    {
      question: {
        type: String,
      },
      answer: {
        type: String,
      },
    },
  ],
  securityQuestionsSetUpRequired: {
    type: Boolean,
    default: false,
  },
  securityQuestionsUpdated: {
    type: Date,
    default: new Date(),
  },
  passwordHint: {
    type: String,
  },
  passwordHintSetUpRequired: {
    type: Boolean,
    default: false,
  },
  passwordTemplateId: {
    type: String,
    // required: true,
  },
  authSts: {
    type: String,
    enum: ['passwordLocked', 'twoFALocked', 'unLocked'],
    default: 'unLocked',
  },

  DOB: {
    type: String,
  },
  lastLoggedIn: {
    type: Date,
    default: new Date(),
  },
  isNewUser: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
  organization: {
    type: String,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

userSchema.methods.toJson = function () {
  var userInfo = this.toObject();
  delete userInfo.password;
  return userInfo;
};

userSchema.methods.comparePasswords = function (password, hash, callback) {
  bcrypt.compare(password, hash, callback);
};

module.exports = mongoose.model('User', userSchema);
