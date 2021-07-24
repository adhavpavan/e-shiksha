var Dealer = require('../models/model_dealer');
let User = require('../models/model_userIdentity')
let request = require('request');
let jwt = require('./jwt');
let config = require('./config')
let PasswordTemplate = require('../models/model_passwordTemplate')
let connLogger = require('./connLogger')

function checkRequestType(req, res, next) {

    var bodydata = req.body;
    let sessionData = {
        loginMode: bodydata.loginMode,
        connectionType: bodydata.connectionType,
        logOnTransactionId: bodydata.logOnTransactionId,
        clientIpAddress: bodydata.clientIpAddress,
        macAddress: bodydata.macAddress,
        userType: bodydata.userType
    }
	//console.log(sessionData);

    if (bodydata.userId) {
        if (bodydata.userType == "Dealer") {
            Dealer.findOne({ "dealerCode": bodydata.userId }, function (err, doc) {
                if (err) {
                    res.status(500).send({ status: "error", message: 'DB error' })
                }
                else if (doc) {
					var email=doc._doc.email;
					console.log(email);
					
					
                    if (doc.pwdType == 'DB') {
						console.log(doc.pwdType);
						console.log(doc.pwdType);
                        next()
                    }
                    else {

                        if (!bodydata.userId) {
                            res.status(400).json({
                                "Message": "User Id is required.",
                                "status": 'badRequest'
                            });
                        }
                        else if (!bodydata.password) {
                            res.status(400).json({
                                "Message": "Password is required.",
                                "status": 'badRequest'
                            });
                        }
                        else if (!bodydata.loginMode) {
                            res.status(400).json({
                                "Message": "LoginMode is required.",
                                "status": 'badRequest'
                            });
                        }
                        else if (!bodydata.userType) {
                            res.status(400).json({
                                "Message": "User Type is required.",
                                "status": 'badRequest'
                            });
                        }
                        else if (bodydata.userType.toLowerCase() != "dealer") {
                            res.status(400).json({
                                "Message": "Invalid User Type.",
                                "status": 'badRequest'
                            });
                        }
                        else {
							
                            req.body.username = email.split("@")[0];
                            request({
                                uri: "https://" + config.ENV.DEV_IP + ":" + config.VALUES.HTTP_PORT + "/ldapLogin",
                                method: "POST",
                                body: req.body,
                                json: true
                            }, function (err, data, body) {
                                if (err) {
                                    console.log(err)
                                    res.status(500).send('error')
                                }
                                else if (data.statusCode == 200) {
                                    res.status(200).send(body)
                                }
                                else {
                                    //Increase the count of password attempts by one. 
                                    User.findOne({ "clientCode": bodydata.userId }).lean().exec(function (err, user) {
                                        if (!user) {
                                            res.status(404).json({
                                                "Message": "User Not Found.",
                                                "status": 'notFound'
                                            });
                                        }
                                        else if (user.userType != bodydata.userType) {
                                            res.status(404).json({
                                                "Message": bodydata.userType + " don't exist.",
                                                "status": 'notFound'
                                            });
                                        }
                                        else {
                                            PasswordTemplate.findOne({ 'passwordTemplateId': user.passwordTemplateId }).lean().exec(function (err, passwordTemplate) {

                                                jwt.updatePasswordAttempt(user, req, passwordTemplate);
                                                if (user.authSts == "unLocked") {
                                                    reason = "Incorrect password attempt " + (user.passwordAttempts + 1) + ".";
                                                    connLogger.mongoLog(user, "Failed", 0, reason, sessionData);
                                                    res.status(401).json({
                                                        "Message": "Number of attempts remaining are :" +
                                                            ((typeof passwordTemplate.maximumNumberOfPasswordFailedAttemptsAllowed !== 'undefined' ?
                                                                passwordTemplate.maximumNumberOfPasswordFailedAttemptsAllowed : config.LOGIN_ATTEMPTS) - user.passwordAttempts - 1) + " ",
                                                        "status": 'badCredentials'
                                                    });
                                                }
                                                else {
                                                    reason = "Account Locked due to excess number of incorrect password attempts."
                                                    connLogger.mongoLog(user, "Failed", 0, reason, sessionData);
                                                    res.status(400).json({
                                                        "Message": "Account locked due to failed attempts.",
                                                        "status": 'profileLocked'
                                                    });
                                                }
                                                // res.status(data.statusCode).send(data.body)

                                            });


                                        }
                                    })

                                }

                            })
                        }
                    }

                }
                else {
                    res.status(404).send({ status: "error", message: 'user not found' })
                }
            })
        }
        else {
            next()
        }

    }
    else {
        res.status(400).send({ status: "error", message: 'userId is missing' })
    }


}
module.exports = {
    checkRequestType: checkRequestType
}