var ConnLog = require("../models/model_connLog.js");
var Customer = require("../models/model_customer");
var Dealer = require("../models/model_dealer");
var log = require("../helpers/logger").childLog("mongologs");

var mongoLog = function (user, connectionStatus, successOrFailure, reason, session) {
    if (user.userType == "Customer") {
        Customer.findOne({ "clientCode": user.clientCode }).lean().exec(function (err, customer) {
            var connLogInstance = {};
            connLogInstance.userName = customer.fname;
            connLogInstance.groupID = customer.groupID || null;
            connLogInstance = createConnLogInstance(connLogInstance, user, customer, connectionStatus, successOrFailure, reason, session);
            var logInstance = new ConnLog(connLogInstance);
            logInstance.save(function (err, doc1) {
                if (err)
                    log.error("Error in saving mongoLog.");
                else
                    log.info("Mongo log saved successfully.");

            });
        });
    }
    else {
        Dealer.findOne({ "dealerCode": user.clientCode }).lean().exec(function (err, dealer) {
            var connLogInstance = {};
            connLogInstance.userName = dealer.dealerName || null;
            connLogInstance.groupID = dealer.groupID || null;
            connLogInstance = createConnLogInstance(connLogInstance, user, dealer, connectionStatus, successOrFailure, reason, session);
            var logInstance = new ConnLog(connLogInstance);
            logInstance.save(function (err, doc1) {
                if (err)
                    log.error("Error in saving mongoLog.");
                else
                    log.info("Mongo log saved successfully.");

            });
        });
    }
}

var createConnLogInstance = function (connLogInstance, user, client, connectionStatus, successOrFailure, reason, session) {
    connLogInstance.clientCode = user.clientCode;
    connLogInstance.date = new Date();
    connLogInstance.connection = client.loginSeg;
    connLogInstance.connectionStatus = connectionStatus;
    connLogInstance.category = user.userType;
    connLogInstance.successOrFailure = successOrFailure;
    connLogInstance.reason = reason;
    connLogInstance.connectionMode = session.loginMode;
    return connLogInstance;
}

module.exports = {
    mongoLog: mongoLog
};