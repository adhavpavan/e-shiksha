const User = require('../models/user');
const publicUtils = require('../helpers/publicUtils');
const config = require('../../config/development');
//const htmlFile = require('../../public');
const jwt = require('../helpers/jwt');

function forgotPwd(req, res, next) {
  let body = req.body;
  User.findUser({ email: body.email })
    .then((data) => {
      if (data) {
        var payload = {
          email: data.email,
          expiry: config.OFFLINE_TOKEN_EXPIRY,
        };
        let token = publicUtils.createToken(payload, config.SECRET);

        var emailConfig = {
          title: 'Password Reset Link',
          template: config.EMAILTEMPLATES.FORGOTPASSWORD.PATH,
          subject: 'Link For Resetting the Password',
        };
        data.resetPasswordToken = token;
        data.resetPasswordExpires = Date.now() + 60;
        data.save(function (err, user) {
          if (err) {
            res.status(500).send(publicUtils.prepareResponse({ message: 'DB Error' }, [], false, 'DB error'));
          } else {
            var sendMail;
            sendMail = jwt
              .sendMailForgotPassword(data, emailConfig)
              .then((sendmail) => {
                res.status(200).send(publicUtils.prepareResponse({ email: user.email }, [], true, 'Email send successfully'));
              })
              .catch((err) => {
                res.status(400).send(publicUtils.prepareResponse({ message: err.message }, ['SMTP error'], false, 'SMTP error'));
              });
          }
        });
      } else {
        res.status(400).send(publicUtils.prepareResponse({ message: 'Email Id is missing' }, ['EmailId incorrect'], false, 'Email Id is missing'));
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(publicUtils.prepareResponse({ message: err.message }, err.message, false, 'DB error'));
    });
}

module.exports = { forgotPwd };
