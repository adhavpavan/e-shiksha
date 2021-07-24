var request = require('request');
var http = require("http");
var Session = require("../models/model_session");
var Customer = require("../models/model_customer");
var User = require("../models/model_userIdentity");
var Dealer = require("../models/model_dealer");
var RiskProfileTemplate = require("../models/model_riskprofiletemplate");
var ScripProfile = require("../models/model_scripprofile");
var publicUtils = require("../helpers/publicUtils");
var connLogger = require("./connLogger.js");
var loginResponse = require("./loginResponse");
var config = require('../helpers/config');
var log = require("../helpers/logger").childLog("utils.login");
var statusArray = config.STATUS_ARRAY;
var sessionId;
var type='';
var loginCheck = function (user, sessionData, index, sessions, req, res, passwordTemplate, eciperTemplate) {
    var previousStatusIndex, loginRequest = false;
    if (index > 0) {
        previousStatusIndex = index - 1;//Can be used to determine the request endpoint. 
        loginRequest = false;//Check whether the request is coming from the login API endpoint.
    }
    else {
        previousStatusIndex = 0;
        loginRequest = true;
    }
    //This is useful to know the previous status.i.e..,from which API it is called.
    var previousStatus = statusArray[previousStatusIndex];
    for (var i = index; i < statusArray.length; i++) {
		if(req.session){
			type=req.session.loginType=="LDAP"?req.session.loginType:"DB";
		}
        if (getNextStatus(statusArray[i], user, sessions, sessionData, passwordTemplate, eciperTemplate) == true) {

            session = sessionData;

            var currentStatus = '';
            currentStatus = statusArray[i];
            session.status = currentStatus;

            session.lastActiveTimeStamp = new Date();
            session.save(function (err, doc) {
                sessionId = doc._id;
                /**
                 * Checking whether the respone is for the first time in the login API flow.
                 * If it is first time we will return a JWT in response else we will just return 
                 * the status in the response.Creating a JWT only for the login request.
                 */
                if (previousStatusIndex == 0 && loginRequest == true) {
                    var payload = {
                        clientCode: user.clientCode,
                        sessionId: sessionId,
                        userType: sessionData.userType
                    };
                    var token = publicUtils.createToken(payload, config.SECRET);
                    if (doc.userType == "Customer") {
                        Customer.findOne({ "clientCode": user.clientCode }).lean().exec(function (err, customer) {

                            if (!customer) {
                                res.status(404).json({
                                    "Message": "User Not Found.",
                                    "status": 'notFound'
                                });
                            }
                            //Checking for connection mode.Customer can login in some connection modes only.
                            else if (!publicUtils.isConnectionModeValid(doc, customer)) {
                                res.status(400).json({
                                    "Message": "Invalid Connection Type.",
                                    "status": 'badRequest'
                                });
                            }
                            // else if (!publicUtils.isMacAddressValid(doc, customer)) {
                            //     res.status(400).json({
                            //         "Message": "Invalid Mac Address.",
                            //         "status": 'badRequest'
                            //     });
                            // }
                            // else if (!publicUtils.isIpAddressValid(doc, customer)) {
                            //     res.status(400).json({
                            //         "Message": "Invalid Mac Address.",
                            //         "status": 'badRequest'
                            //     });
                            // }
                            else {
                                RiskProfileTemplate.find({ "RiskTemplateID": customer.riskProfTmplt })
                                    .lean()
                                    .exec(function (err, riskProfileTemplates) {
                                        ScripProfile.findOne({ "userid": user.clientCode, "isDefault": true })
                                            .lean()
                                            .exec(function (err, scripProfile) {
                                                var productTypeAllowed = [];
                                                var product = "";
                                                riskProfileTemplates.forEach(function (riskProfileTemplate) {
                                                    product = riskProfileTemplate.Exchange + "_" + riskProfileTemplate.Segment
                                                        + "_" + riskProfileTemplate.ProductCode;
                                                    productTypeAllowed.push(product);
                                                    product = "";
                                                });
                                                var response = loginResponse.responseObject(token, user, customer, doc, passwordTemplate, eciperTemplate, scripProfile);
                                                response.productsAllowed = productTypeAllowed;
                                                
                                                res.status(200).json(response);
                                            });
                                    });
                            }
                        });
                    }
                    else {
                        Dealer.findOne({ "dealerCode": user.clientCode }).lean().exec(function (err, dealer) {
                            if (!dealer) {
                                res.status(404).json({
                                    "Message": "User Not Found.",
                                    "status": 'notFound'
                                });
                            }
                            //Checking for connection mode.Customer can login in some connection modes only.
                            else if (!publicUtils.isConnectionModeValid(doc, dealer)) {
                                res.status(400).json({
                                    "Message": "Invalid Connection Type.",
                                    "status": 'badRequest'
                                });
                            }
                            // else if (!publicUtils.isMacAddressValid(doc, dealer)) {
                            //     res.status(400).json({
                            //         "Message": "Invalid Mac Address.",
                            //         "status": 'badRequest'
                            //     });
                            // }
                            // else if (!publicUtils.isIpAddressValid(doc, dealer)) {
                            //     res.status(400).json({
                            //         "Message": "Invalid Mac Address.",
                            //         "status": 'badRequest'
                            //     });
                            // }
                            else {
                                RiskProfileTemplate.find({ "RiskTemplateID": dealer.riskProfTmplt })
                                    .lean()
                                    .exec(function (err, riskProfileTemplates) {
                                        ScripProfile.findOne({ "userid": user.clientCode, "isDefault": true })
                                            .lean()
                                            .exec(function (err, scripProfile) {
                                                var productTypeAllowed = [];
                                                var product = "";
                                                riskProfileTemplates.forEach(function (riskProfileTemplate) {
                                                    product = riskProfileTemplate.Exchange + "_" + riskProfileTemplate.Segment
                                                        + "_" + riskProfileTemplate.ProductCode;
                                                    productTypeAllowed.push(product);
                                                    product = "";
                                                });
                                                var response = loginResponse.responseObject(token, user, dealer, doc, passwordTemplate, eciperTemplate, scripProfile);
                                                response.productsAllowed = productTypeAllowed;
                                                connLogger.mongoLog(user, "Connected", 1, "User Logged in Successfully.", session);
                                                res.status(200).json(response);
                                            });
                                    });
                            }
                        });
                    }
                }
                else {
                    var response = {};

                    response.status = currentStatus
                    /**
                     * After the password has been updated returning the optional calls that a non-authenticated user can make. 
                    */
                    if (previousStatus == "passwordExpired") {



                        response.optional = [];

                        response.optional.push("setPasswordHint");
                        response.Message = "Password Changed Successfully.This new password will expire in" + " "
                            + passwordTemplate.maxDaysAllowedForPasswordExpiry + " " + "Days.";
                        if (publicUtils.setSecurityQuestion(user, eciperTemplate) == false)
                            response.optional.push("setSecurityQuestions");
                        connLogger.mongoLog(user, "Connected", 1, "Password Changed Successfully.", session);
                        res.status(200).json(response);
                    }
                    else if (previousStatus == "2faRequired" && statusArray[i] == "authenticated")//After 2fa returning the 
                    {
                        response.offlineBearerToken = doc.offlineJWT || null;
                        user.lastLoggedIn = new Date();
                        var userInstance = new User(user);
                        userInstance.isNew = false;
                        userInstance.isNewUser = false;
                        userInstance.eCiperAttempts = 0;
                        userInstance.passwordAttempts = 0;
                        connLogger.mongoLog(user, "Connected", 1, "User Logged in Successfully.", session);
                        userInstance.save(function (err, doc1) {
                            if (err)
                                console.log("err", err);
                        });
                        res.status(200).json(response);
                    }
                    else {
                        if (previousStatus == "forceLogout") {
                            config.GET_HOST_OPTIONS.url = config.GET_HOST_OPTIONS_URL + user.clientCode;
                            //console.log("config.GET_HOST_OPTIONS.url",config.GET_HOST_OPTIONS); 
                            request(config.GET_HOST_OPTIONS, function (error, response, body) {
                                // console.log(response.statusCode);
                                if (error) {
                                    console.log(error);
                                } else {
                                    body = JSON.parse(body);
                                    if (body["clients"].length > 0) {
                                        if (body["clients"][0].host) {
                                            let clients=body["clients"];
                                           // let ActiveSessions=new Array();
                                            let activeSession={};
                                            for(let i=0;i<clients.length;i++){
                                                if(clients[i].status_label.toLowerCase()=='running'){
                                                    activeSession.host=clients[i].host
                                                    break;
                                                }
                                            }
                                     

                                            config.FORCE_LOGOUT_MESSAGE_OPTIONS.url = config.FORCE_LOGOUT_MESSAGE_OPTIONS_URL +activeSession.host;

                                            request(config.FORCE_LOGOUT_MESSAGE_OPTIONS, function (err, response, body) {
                                                if (response.statusCode == 202)
                                                    log.info("Host Removed");
                                            });
                                        }
                                    }
                                }
                            });
                        }
                        res.status(200).json(response);
                    }

                }
            });
            break;
        }
    }
}

function getNextStatus(status, user, sessions, sessionData, passwordTemplate, eciperTemplate) {

    var functions = {

        'setPasswordHint': function () {
            return false;
        },

        'setSecurityQuestions': function () {
            //Checking whether the security questions setup is required or not.
            var isSecurityQuestionsRequired = publicUtils.setSecurityQuestion(user);
            return isSecurityQuestionsRequired;
        },
        'passwordExpired': function () {
            //Validating for password expiry.
			if(type=="LDAP"){
				return false;
			}else{
				var isPasswordExpired = publicUtils.passwordExpired(user, passwordTemplate);
               return isPasswordExpired;
			}
            
        },

        '2faRequired': function () {
            var is2faRequired = publicUtils.is2FARequired(eciperTemplate);

            return true;
        },

        'forceLogout': function () {
            //Validating for unique authenticated sessions.
            var isForceLogout = publicUtils.forceLogout(sessions, sessionData);
            return isForceLogout;
        },

        'authenticated': function () {
            return true;
        }

    };
    return functions[status]();

}

module.exports =
    {
        loginCheck: loginCheck
    }   