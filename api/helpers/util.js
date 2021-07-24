"use strict";

var log = require("../helpers/logger").childLog("utils.public");
var bcrypt = require("bcrypt-nodejs");
var config = require("../helpers/config");
var jwt = require("../helpers/jwt");
var forwarded = require("forwarded-for");
var Session = require("../models/model_session");
var ForgotPassword = require("../models/model_forgotPassword");
var Customer = require("../models/model_customer");
var Dealer = require("../models/model_dealer");

var generateHash = function (string, strength) {
  strength = strength || 6;
  var salt = bcrypt.genSaltSync(strength);
  var hash = bcrypt.hashSync(string, salt, null);
  return hash;
};

//Generating Random Password for the new users.
var generateRandomPassword = function () {
  var chars = config.VALUES.PASSWORD_CHARS;
  var pass = "";
  for (var x = 0; x < 6; x++) {
    var i = Math.floor(Math.random() * chars.length);
    pass += chars.charAt(i);
  }
  return pass;
};

var validatePassword = function (password, passwordregex) {
  // var passwordregex =/^(?=.*[a-zA-Z])(?=.*[0-9])/;
  return passwordregex.test(password);
};

var addUserSession = function (req, clientCode, appType) {
  var forwardReq = forwarded(req, req.headers);
  var request = {
    ip: forwardReq.ip,
    browserAgent: req.headers["user-agent"],
    clientCode: clientCode,
    appType: appType,
    activeTimeStamp: new Date(),
  };
  var sessionInstance = new Session(request);
  Session.remove({
    clientCode: clientCode,
    appType: appType,
  }).exec(function (err, docs) {
    sessionInstance.save(function (doc, err) {
      log.info("New session initiated.");
    });
  });
};

var addForgotPassword = function (req) {
  var forgotPasswordInstance = new ForgotPassword(req);
  forgotPasswordInstance.save(function (doc, err) {
    log.info("New Forgot Password initiated.");
  });
};

//Creating a token using payload and secret key.
var createToken = function (payload, key) {
  payload.createdAt = new Date();
  var token = jwt.encode(payload, key);
  return token;
};

var is2FARequired = function (eciperTemplate) {
  if (eciperTemplate.method == "none") return false;
  else return true;
};
var generateRandomKey = function () {
  var chars = config.VALUES.KEY_CHARS;
  var key = "";
  for (var x = 0; x < 24; x++) {
    var i = Math.floor(Math.random() * chars.length);
    key += chars.charAt(i);
  }
  return key;
};

var daysDiff = function (first, second) {
  return Math.round((second - first) / (1000 * 60 * 60 * 24));
};

var profilePasswordLocked = function (user) {
  if (user.authSts != "unLocked") return true;
  else return false;
};

var profiletwoFALocked = function (user) {
  if (user.authSts != "unLocked") return true;
  else return false;
};

var setPasswordHint = function (user) {
  if (user.passwordHintSetUpRequired == true) return true;
  else return false;
};

var setSecurityQuestion = function (user, eciperTemplate) {
  if (user.securityQuestionsSetUpRequired == true) return true;
  else return false;
};

var passwordExpired = function (user, passwordTemplate) {
  var difference = daysDiff(user.passwordUpdated, new Date());
  console.log("difference:" + difference);
  console.log("passwordUpdated:" + user.passwordUpdated);
  console.log("maxdays:" + passwordTemplate.maxDaysAllowedForPasswordExpiry);

  if (
    difference > passwordTemplate.maxDaysAllowedForPasswordExpiry ||
    user.passwordInvalidated == true
  )
    return true;
  else return false;
};

var twoFARequired = function (user) {
  if (user.ecipherType == "none") return false;
  else return true;
};

var forceLogout = function (sessions, sessionData) {
  var sameSession = false;
  sessions.forEach(function (session) {
    if (sessionData.loginMode == "WEB" || sessionData.loginMode == "DIRECT") {
      if (
        (session.loginMode == "WEB" || session.loginMode == "DIRECT") &&
        session.status == "authenticated" &&
        isSessionValid(session)
      )
        sameSession = true;
    } else {
      if (
        session.loginMode == sessionData.loginMode &&
        session.status == "authenticated" &&
        isSessionValid(session)
      )
        sameSession = true;
    }
  });
  if (sameSession == true) return true;
  else return false;
};

var isSessionValid = function (session) {
  var buffer = config.JWT_EXPIRY;
  var lastActiveTimeStamp = session.lastActiveTimeStamp;
  var now = new Date();
  var diff = now - lastActiveTimeStamp;
  var diffInMinutes = Math.floor(((diff % 86400000) % 3600000) / 60000);
  //Validating the session.i.e..,Checking whether the session is expired or not.
  if (diffInMinutes >= buffer) return false;
  else return true;
};

//Validating for duplication in array
var hasDuplicates = function (array) {
  var valuesSoFar = Object.create(null);
  var hasDuplicates = false;
  for (var i = 0; i < array.length; ++i) {
    var value = array[i].question;
    if (value in valuesSoFar) {
      hasDuplicates = true;
    }
    valuesSoFar[value] = true;
  }
  return hasDuplicates;
};

var hasAnswerNull = function (answers) {
  var hasNull = false;
  answers.forEach(function (answer) {
    if (!answer.answer) hasNull = true;
  });
  return hasNull;
};

var hasQuestionNull = function (answers) {
  var hasNull = false;
  answers.forEach(function (answer) {
    if (!answer.question) hasNull = true;
  });
  return hasNull;
};

var validateQuestionLength = function (answers) {
  var flag = false;
  answers.forEach(function (answer) {
    if (answer.question.length < config.SECURITY_QUESTION_MINIMUM_LENGTH)
      flag = true;
  });
  return flag;
};

var createSessionObject = function (user, sessionData) {
  var session = {
    clientCode: user.clientCode,
    loginMode: sessionData.loginMode,
    connectionType: sessionData.connectionType,
    clientIpAddress: sessionData.clientIpAddress,
    macAddress: sessionData.macAddress,
    forceLoginFlag: sessionData.forceLoginFlag,
    logOnTransactionId: sessionData.logOnTransactionId,
    userType: sessionData.userType,
    createdTimeStamp: new Date(),
    lastActiveTimeStamp: new Date(),
  };
  return session;
};

var hasOnlyWhiteSpaces = function (answers, type) {
  var flag = false;
  if (type == "questions") {
    answers.forEach(function (answer) {
      if (answer.question.trim().length == 0) flag = true;
    });
  } else {
    answers.forEach(function (answer) {
      if (answer["answer"].trim().length == 0) flag = true;
    });
  }
  return flag;
};

var hasInvalidSpecialCharacters = function (answers, eciperTemplate, type) {
  var isInvalid = false;
  if (eciperTemplate.specialCharactersAllowedList) {
    var exp = eciperTemplate.specialCharactersAllowedList;
    exp = exp.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    exp = "^[a-zA-Z 0-9" + exp + "]*$";
    var regex = new RegExp(exp);
    isInvalid = validatingSpecialCharacters(answers, regex, type, isInvalid);
  } else {
    var regex =
      config.REGEX_SPECIAL_CHARACTERS_ALLOWED_FOR_SECUIRTY_QUESTION_AND_ANSWERS;
    isInvalid = validatingSpecialCharacters(answers, regex, type, isInvalid);
  }
  return isInvalid;
};

var validatingSpecialCharacters = function (answers, regex, type, isInvalid) {
  answers.forEach(function (answer) {
    if (type == "questions") {
      if (!answer.question.match(regex)) {
        isInvalid = true;
      }
    } else {
      if (!answer.answer.match(regex)) {
        isInvalid = true;
      }
    }
  });
  return isInvalid;
};

var isConnectionModeValid = function (doc, user) {
  var isValid = false;
  var map = {};
  if (doc.userType == "Customer") {
    user.connMode.forEach(function (mode) {
      map[mode] = 1;
      if (mode == "TWS") map["DIRECT"] = 1;
    });
    if (map[doc.loginMode] == 1) isValid = true;
  } else {
    user.DealerConnectionMode.forEach(function (mode) {
      map[mode] = 1;
      if (mode == "TWS") map["DIRECT"] = 1;
    });
    if (map[doc.loginMode] == 1) isValid = true;
  }
  return isValid;
};

var isMacAddressValid = function (doc, user) {
  var isValid = false;
  console.log("doc.macAddress", doc.macAddress);
  if (!user.MACAddr) {
    if (doc.userType == "Customer") {
      Customer.findByIdAndUpdate(
        user._id,
        {
          MACAddr: doc.macAddress,
        },
        function (err, doc) {
          if (err) log.error(err);
        }
      );
      return true;
    } else {
      Dealer.findByIdAndUpdate(
        user._id,
        {
          MACAddr: doc.macAddress,
        },
        function (err, doc) {
          if (err) log.error(err);
        }
      );
      return true;
    }
  } else {
    if (doc.macAddress == user.MACAddr) isValid = true;
  }
  return isValid;
};

var isIpAddressValid = function (doc, user) {
  var isValid = false;
  if (!user.IPAddr) {
    if (doc.userType == "Customer") {
      Customer.findByIdAndUpdate(
        user._id,
        {
          IPAddr: doc.clientIpAddress,
        },
        function (err, doc) {
          if (err) log.error(err);
        }
      );
      return true;
    } else {
      Dealer.findByIdAndUpdate(
        user._id,
        {
          IPAddr: doc.clientIpAddress,
        },
        function (err, doc) {
          if (err) log.error(err);
        }
      );
      return true;
    }
  } else {
    if (doc.macAddress == user.MACAddr) isValid = true;
  }
  return isValid;
};

module.exports = {
  generateHash: generateHash,
  generateRandomPassword: generateRandomPassword,
  generateRandomKey: generateRandomKey,
  addUserSession: addUserSession,
  validatePassword: validatePassword,
  addForgotPassword: addForgotPassword,
  daysDiff: daysDiff,
  profilePasswordLocked: profilePasswordLocked,
  setPasswordHint: setPasswordHint,
  setSecurityQuestion: setSecurityQuestion,
  passwordExpired: passwordExpired,
  forceLogout: forceLogout,
  hasDuplicates: hasDuplicates,
  twoFARequired: twoFARequired,
  createToken: createToken,
  createSessionObject: createSessionObject,
  hasAnswerNull: hasAnswerNull,
  hasQuestionNull: hasQuestionNull,
  validateQuestionLength: validateQuestionLength,
  profiletwoFALocked: profiletwoFALocked,
  isSessionValid: isSessionValid,
  hasOnlyWhiteSpaces: hasOnlyWhiteSpaces,
  isConnectionModeValid: isConnectionModeValid,
  isMacAddressValid: isMacAddressValid,
  isIpAddressValid: isIpAddressValid,
  hasInvalidSpecialCharacters: hasInvalidSpecialCharacters,
  is2FARequired: is2FARequired,
};
