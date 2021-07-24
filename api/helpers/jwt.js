var fs = require('fs');
// var mongoose = require("mongoose");
// var forwarded = require("forwarded-for");
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var _ = require('underscore');
const config = require('../../config/development');
const path = require('path');
// var jsonPath = require("JSONPath");
// var User = require("../models/model_userIdentity");
// var log = require("./logger").childLog("jwt");
// var Customer = require("../models/model_customer");
_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g,
};

//Encoding the JWT.
var encode = function (payload, secretKey) {
  algorithm = 'HS256';
  var header = {
    type: 'JWT',
    alg: algorithm,
  };
  var jwt = base64Encode(JSON.stringify(header)) + '.' + base64Encode(JSON.stringify(payload));
  return jwt + '.' + sign(jwt, secretKey);
};

//Decoding the JWT.
var decode = function (token, secretKey) {
  try {
    var segments = token.split('.');
    var header = JSON.parse(base64Decode(segments[0].split(' ')[1]));
    var payload = JSON.parse(base64Decode(segments[1]));
    var rawSignature = segments[0].split(' ')[1] + '.' + segments[1];
    if (verifySignature(rawSignature, secretKey, segments[2])) {
      return payload;
    }
  } catch (ex) {
    return null;
  }
};

var refreshToken = function (payload, secretKey) {
  var current = new Date();
  payload.exp = current.setMinutes(current.getMinutes() + config.TIMEOUT);
  return this.encode(payload, secretKey);
};

var isTokenExpired = function (payload) {
  var expiration = payload.exp;
  var current = new Date().getTime();
  var diff = current - expiration;
  var diffMin = Math.round(((diff % 86400000) % 3600000) / 60000);
  return diffMin >= 0 ? true : false;
};

var clearSession = function (Session, req, res) {
  var request = {
    userEmail: { $regex: new RegExp('^' + req.userInfo.user.email + '$', 'i') },
    isActive: true,
  };
  Session.remove(request).exec();
};

exports.isSessionActive = function (session, clientCode) {
  var request = {
    clientCode: clientCode,
  };
  return session.find(request).exec();
};

// exports.isUniqueLogin = function (session, req, res) {
//     var forwardReq = forwarded(req, req.headers);
//     var request = {
//         ip: forwardReq.ip,
//         browserAgent: req.headers['user-agent'],
//         userEmail: req.userInfo.email
//     };
//     return session
//         .find(request)
//         .exec();
// };

exports.isPublic = function (req) {
  return req.url.indexOf('/public') > -1 ? true : false;
};

var updatePasswordAttempt = function (userInstance, req, passwordTemplate) {
  User.findByIdAndUpdate(
    userInstance._id,
    {
      $inc: { passwordAttempts: 1 },
    },
    function (err, doc) {
      if (err) log.error(err);
      if (
        doc.passwordAttempts >=
        (typeof passwordTemplate.maximumNumberOfPasswordFailedAttemptsAllowed !== 'undefined'
          ? passwordTemplate.maximumNumberOfPasswordFailedAttemptsAllowed
          : config.LOGIN_ATTEMPTS) -
          1
      ) {
        Customer.findOneAndUpdate({ clientCode: userInstance.clientCode }, { pwdSts: 'Locked' }, function (err, customer) {
          if (err) log.error(err);
          else log.info(customer);
        });

        User.findByIdAndUpdate(
          userInstance._id,
          {
            authSts: 'passwordLocked',
          },
          function (err, doc) {
            if (err) {
              log.error(err);
            } else {
              log.info(doc);
              var emailConfig = {
                title: config.EMAILTEMPLATES.PASSWORDACCOUNTLOCK.TITLE,
                template: config.EMAILTEMPLATES.PASSWORDACCOUNTLOCK.PATH,
                subject: config.EMAILTEMPLATES.PASSWORDACCOUNTLOCK.SUBJECT,
              };
              var profileLockedMail = sendMail(userInstance, emailConfig, req.body.host); //sending temporary password to email.
              profileLockedMail.then(
                function (info) {
                  log.info(info);
                },
                function (err) {
                  log.error(err);
                }
              );
            }
          }
        );
      } else {
        log.info(doc);
      }
    }
  );
};
var resetCustomerPasswordStatus = function (userInstance) {
  Customer.findOneAndUpdate({ clientCode: userInstance.clientCode }, { pwdSts: 'Activate' }, function (err, doc) {
    if (err) log.error(err);
    else log.info(doc);
  });
};
var resetPasswordAttempt = function (userInstance) {
  User.findByIdAndUpdate(
    userInstance._id,
    {
      passwordAttempts: 0,
      forgotPasswordToken: false,
    },
    function (err, doc) {
      if (err) log.error(err);
    }
  );
};

var updateECiperAttempt = function (userInstance, eCiperTemplate, req) {
  User.findByIdAndUpdate(
    userInstance._id,
    {
      $inc: { eCiperAttempts: 1 },
    },
    function (err, doc) {
      if (err) log.error(err);
      if (doc.eCiperAttempts >= eCiperTemplate.numberOfAttempts) {
        User.findByIdAndUpdate(
          userInstance._id,
          {
            authSts: 'twoFALocked',
          },
          function (err, doc) {
            if (err) {
              log.error(err);
            } else {
              log.info(doc);
              var emailConfig = {
                title: config.EMAILTEMPLATES.SECURITYACCOUNTLOCK.TITLE,
                template: config.EMAILTEMPLATES.SECURITYACCOUNTLOCK.PATH,
                subject: config.EMAILTEMPLATES.SECURITYACCOUNTLOCK.SUBJECT,
              };
              var profileLockedMail = sendMail(userInstance, emailConfig, req.body.host); //sending temporary password to email.
              profileLockedMail.then(
                function (info) {
                  log.info(info);
                },
                function (err) {
                  log.error(err);
                }
              );
            }
          }
        );
      } else {
        log.info(doc);
      }
    }
  );
};

var resetECiperAttempt = function (userInstance) {
  User.findByIdAndUpdate(
    userInstance._id,
    {
      eCiperAttempts: 0,
    },
    function (err, doc) {
      if (err) log.error(err);
    }
  );
};

var resetForgotPasswordToken = function (userInstance) {
  User.findByIdAndUpdate(
    userInstance._id,
    {
      forgotPasswordToken: false,
    },
    function (err, doc) {
      if (err) log.error(err);
    }
  );
};

var sendMail = function (userInstance, mailConfig, host) {
  return new Promise(function (resolve, reject) {
    // if (!config.DISABLE_USER_CREATION_SMTP_SERVICE) {
    var transporter = nodemailer.createTransport(smtpTransport(config.NODEMAILER));
    var mailOptions = {
      from: mailConfig.title + ' <' + config.MAILER.FROM + '>',
      to: userInstance.email,
      subject: mailConfig.subject,
      html: getHtml(userInstance, host, mailConfig),
    };
    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        log.error(err);
        reject(err);
      }
      resolve('sendmail');
    });

    // } else {
    //     resolve("sendmail");
    // }
  });
};

function verifySignature(raw, secret, signature) {
  return signature === sign(raw, secret);
}

function sign(str, key) {
  return crypto.createHmac('sha256', key).update(str).digest('base64');
}

function base64Encode(str) {
  return new Buffer(str).toString('base64');
}

function base64Decode(str) {
  return new Buffer(str, 'base64').toString();
}

function getHtml(user, host, mailConfig) {
  user.fname = user.fname.charAt(0).toUpperCase() + user.fname.slice(1);
  if (user.lname) user.lname = user.lname.charAt(0).toUpperCase() + user.lname.slice(1);
  var model = {
    verifyEmail: host,
    mailConfig: mailConfig,
    username: user.email.toLowerCase(),
    fname: user.fname,
    lname: user.lname,
    password: user.tempPassword || null,
    newPassword: user.newPassword || null,
    clientCode: user.clientCode || null,
  };

  var path = mailConfig.template;
  var html = fs.readFileSync(path, 'utf8');
  var template = _.template(html);

  return template(model);
}

var sendMailForgotPassword = function (userInstance, mailConfig) {
  return new Promise(function (resolve, reject) {
    var transporter = nodemailer.createTransport(smtpTransport(config.NODEMAILER));
    var mailOptions = {
      from: mailConfig.title + ' <' + config.MAILER.FROM + '>',
      to: userInstance.email,
      subject: mailConfig.subject,
      html: getHtmlForgotPassword(userInstance, mailConfig),
    };
    transporter.sendMail(mailOptions, function (err, info) {
      if (err) reject(err);

      resolve('sendmail');
    });
  });
};
function getHtmlForgotPassword(user, mailConfig) {
  user.firstName = user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1);
  if (user.lastName) user.lastName = user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1);
  var model = {
    //verifyEmail: host,
    mailConfig: mailConfig,
    username: user.email.toLowerCase(),
    fname: user.firstName,
    lname: user.lastName,
    url: config.FORGOTPASSWORDURL + '' + encodeURIComponent(user.resetPasswordToken),
  };

  var templatpath = path.join(__dirname, '..', mailConfig.template);
  var html = fs.readFileSync(templatpath, 'utf8');
  var template = _.template(html);
  return template(model);
}

module.exports = {
  sendMail: sendMail,
  sendMailForgotPassword: sendMailForgotPassword,
  encode: encode,
  decode: decode,
  //   refreshToken: refreshToken,
  //   isTokenExpired: isTokenExpired,
  //   updatePasswordAttempt: updatePasswordAttempt,
  //   resetPasswordAttempt: resetPasswordAttempt,
  //   updateECiperAttempt: updateECiperAttempt,
  //   resetECiperAttempt: resetECiperAttempt,
  //   resetForgotPasswordToken: resetForgotPasswordToken,
  //   resetCustomerPasswordStatus: resetCustomerPasswordStatus,
};
