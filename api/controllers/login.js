const User = require("../models/user");
const publicUtils = require("../helpers/publicUtils");
const config = require("../../config/development");

function loginUser(req, res, next) {
  let body = req.body;
  User.findUser({ email: body.email })
    .then((user) => {
      if (user) {
        user.comparePasswords(body.password, user.password, (err, isMatch) => {
          if (isMatch) {
            var payload = {
              email: user.email,
              expiry: config.OFFLINE_TOKEN_EXPIRY,
            };
            let token = publicUtils.createToken(payload, config.SECRET);
            res
              .status(200)
              .send(
                publicUtils.prepareResponse(
                  { token: token, email: user.email },
                  [],
                  true,
                  "User is logged in"
                )
              );
          } else {
            res
              .status(401)
              .send(
                publicUtils.prepareResponse(
                  { message: "password or email does not match " },
                  ["password incorrect"],
                  false,
                  "Password is incorrect"
                )
              );
          }
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res
        .status(500)
        .send(
          publicUtils.prepareResponse(
            { message: err.message },
            err.message,
            false,
            "DB error"
          )
        );
    });
}
module.exports = { loginUser };
