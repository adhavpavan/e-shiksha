var Agenda = require('agenda'),
  mongoose = require("mongoose");
var config = require('../helpers/config');
var Session = require("../models/model_session");
var agenda = new Agenda({ db: { address: config.MONGO.CONNECT_URL, collection: 'usersessions' } });

agenda.define('delete expired sessions', function (job, done) {
  var buffer = config.SESSION_EXPIRY;
  var current = new Date();
  current.setMinutes(current.getMinutes() - buffer);
  Session.remove({ lastActiveTimeStamp: { $lt: current } }, done);
});

agenda.on('ready', function () {
  agenda.every(config.SCHEDULER_TIME, 'delete expired sessions');
  agenda.start();
});