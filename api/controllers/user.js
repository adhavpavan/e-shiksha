const User = require("../models/user");
const publicUtils = require("../helpers/publicUtils");
function createUser(req, res, next) {
  const body = req.body;
  // var tempPassword = publicUtils.generateRandomPassword();
  var date = new Date();
  var user = body;
  user.passwordInvalidated = true;
  user.password = publicUtils.generateHash(body.password, 6);
  var userInstance = User.createUser(user);
  userInstance
    .save()
    .then((doc) => {
      res.json(
        publicUtils.prepareResponse(
          { message: "User registered successfully" },
          [],
          true,
          "User registered successfully"
        )
      );
    })
    .catch((err) => {
      console.log(err.message);
    
      res.status(409).send(publicUtils.prepareResponse(
        { message: err.message },
        [err.message],
        false,
        "error while creating user"
      ))
        
    });
}
function getUsers(req, res, next) {
  let users = User.getUsers();
  users
    .then((users) => {
      res.json(
        publicUtils.prepareResponse(
          { users: users },
          [],
          true,
          "fetched all user"
        )
      );
    })
    .catch((err) => {
      console.log(err);
      res
        .status(500)
        .send(
          publicUtils.prepareResponse(
            { message: err.message },
            err,
            false,
            "error while fetching"
          )
        );
    });
}

module.exports = { getUsers, createUser };
