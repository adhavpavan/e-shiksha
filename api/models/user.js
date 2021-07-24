const User = require('./schemas/model_user');
const createUser = (user) => {
  return new User(user);
};
const getUsers = () => {
  return User.find({}).select(`-_id firstName lastName userType email  mobile DOB lastLoggedIn createdBy  organization`);
};
const findUser = (input) => {
  return User.findOne({ ...input });
};
module.exports = {
  createUser: createUser,
  getUsers: getUsers,
  findUser: findUser,
};
