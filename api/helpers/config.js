var fs = require("fs");
var env = process.env.NODE_ENV || 'development';
console.log("env", env);
var config = require('../../../config/collections/' + env + '.js');
module.exports = config;