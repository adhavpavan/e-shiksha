'use strict';
var bunyan = require('bunyan');
var config = require('./config');
var log = null;

var init = function () {
    log = bunyan.createLogger({
        name: config.BUNYAN.SITE_NAME,
        src: true,
        streams: [
            {
                level: 'info',
                path: config.LOGGER.INFOPATH,  // log INFO and above to stdout
                period: '1d',   // daily rotation
                count: 3
            },
            {
                level: 'error',
                path: config.LOGGER.ERRORPATH,  // log INFO and above to stdout
                period: '1d',   // daily rotation
                count: 4  // log ERROR and above to a file
            }
        ]
    });
};

var childLog = (childName) => {
    if (log === null) init();
    return log.child({ package: childName });
};

module.exports = {
    log: log,
    childLog: childLog,
    init: init
};

