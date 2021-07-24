const User = require('../models/user');
const publicUtils = require('../helpers/publicUtils');
const config = require('../../config/development');
const jwt = require('../helpers/jwt');
const path = require('path');

function getPwd(req, res, next) {
  let content = publicUtils.resetPwdHtmlContent(req);
  var key = req.query.key;
  res.send(content);
}

function resetPwd(req, res) {
  const body = req.body;
  User.findUser({ resetPasswordToken: body.token })
    .then((data) => {
      if (data) {
        data.password = publicUtils.generateHash(body.newPassword, 6);;
        data.resetPasswordToken = undefined;
        data.resetPasswordExpires = undefined;
        data.save(function (err, user) {
          if (err) {
            res.status(500).send(publicUtils.prepareResponse({ message: 'DB Error' }, [], false, 'DB error'));
          } else {
            res.status(200).send(publicUtils.prepareResponse({}, [], true, 'Password change successfully'));
          }
        });  
      } else {
        res.status(400).send(publicUtils.prepareResponse({ message: 'Token is invalid' }, ['Token is invalid'], false, 'Token is invalid'));
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(publicUtils.prepareResponse({ message: err.message }, err.message, false, 'password reset url is expired '));
    });
}

module.exports = { getPwd, resetPwd };
