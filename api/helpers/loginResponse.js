var config = require('../helpers/config');

var passwordDaysToExpire = function (user, passwordTemplate) {
    var firstDate = new Date();
    var secondDate = user.passwordUpdated;
    secondDate.setDate(secondDate.getDate() + passwordTemplate.maxDaysAllowedForPasswordExpiry);
    var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    var days = Math.round((secondDate.getTime() - firstDate.getTime()) / (oneDay));
    if (days < 0)
        days = 0;
    return days;
}

var securityQuestionsRequired = function (eciperTemplate) {
    if (eciperTemplate.method == "securityQuestions")
        return true;
    else
        return false;
}

var passwordHintSetup = function (user) {
    if (user.passwordHint)
        return true;
    else
        return false;
}

var securityQuestionsSetup = function (user, eciperTemplate) {
    if (user.securityQuestions.length >= eciperTemplate.noOfQuestionsTobeSet)
        return true;
    else
        return false;
}

var specialCharactersAllowedList = function (eciperTemplate) {
    if (eciperTemplate.specialCharactersAllowedList)
        return eciperTemplate.specialCharactersAllowedList;
    else
        return config.SPECIAL_CHARACTERS_ALLOWED_FOR_SECUIRTY_QUESTION_AND_ANSWERS;
}


//Return the response when the status is authenticated.
var responseObject = function (token, user, customer, session, passwordTemplate, eciperTemplate, scripProfile) {
    var response = {};
    
    response.bearerToken = token;
    response.messageConnection = "FTL";
    response.status = session.status;
    response.errorCode = customer.errorCode || null;
    if(session.status == "passwordExpired")
        response.passwordDTE = 0;
    else
        response.passwordDTE = passwordDaysToExpire(user, passwordTemplate) || 0;
    response.logonMsg = "You have logged in." || null;
    response.llt = user.isNewUser == false ? user.lastLoggedIn : null;
    response.msgTime = new Date();
    response.groupId = customer.groupID || null;
    response.userCode = user.clientCode || null;
    response.loginSeg = customer.loginSeg || null;
    response.tradeSeg = customer.tradeSeg || null;
    response.bcastSeg = customer.bcastSeg || null;
    response.riskProfile = customer.riskProfTmplt || null;
    response.investmentProductsAllowed = customer.investmntProd || null;
    response.mpp = config.MARKET_PROTECTION_PERCENTAGE;
    response.col = config.COL;
    response.productsAllowed = customer.productsAllowed || null;
    response.ofs = customer.ofs || null;
    response.bseofs = customer.bseofs || null;
    response.clientType = customer.clType || null;
    response.priceType = customer.priceType || ["Limit", "Market"];
    response.ordType = customer.ordType || [1, 3, 5, 8, 9];
    response.loginDefaultMW = scripProfile != null ? scripProfile.profilename : null;
    if (user.lname)
        response.name = user.fname + " " + user.lname || null;
    else
        response.name = user.fname || null;
    response.passwordExpiryWarningDays = passwordTemplate.numberOfDaysForPasswordExpiryWarning || null;    
    response.loginPwdReset = response.passwordDTE <= 0 ? "Y" : "N";
    response.pwdExpiryMsg = response.loginPwdReset == "Y" ? config.PASSWORD_EXPIRED_MESSAGE : "NO_DATA";
    response.branchCode = customer.branchCode || null;
    
    response.interactiveIp = config.FTL_SERVER_IP;
    response.interactivePort =config.FTL_SERVER_PORT;
    response.broadCastIp = config.FTL_SERVER_IP;
    response.broadCastPort = config.FTL_SERVER_PORT;
    response.maxBcastScrips = customer.maxBcastScrips || null;
    response.participantType = customer.partType || null;
    if (user.userType == "Customer") {
        response.connectionMode = customer.connMode || null;
    } else if (user.userType == "Dealer") {
        response.connectionMode = customer.DealerConnectionMode || null;
    }
    response.brokerageTemplate = customer.brokerageTmplt || null;
    response.dmaAllowed = customer.DMAAllowed || null;
    response.pwdStatus = user.authSts || null;
    response.sorEnabled = customer.SOREnabled || "N";
    response.roleTmpltId = customer.roleTmpltId || null;
    response.twoFAMethod = {};
    response.twoFAMethod.method = eciperTemplate.method || null;
    response.twoFAMethod.noOfQuestionsTobeSet = eciperTemplate.noOfQuestionsTobeSet || null;
    response.securityQuestionsRequired = securityQuestionsRequired(eciperTemplate);
    response.passwordHintSetup = passwordHintSetup(user);
    response.securityQuestionsSetup = securityQuestionsSetup(user, eciperTemplate);
    response.sessionExpiryTime = config.SESSION_EXPIRY;
    response.specialCharactersAllowed = specialCharactersAllowedList(eciperTemplate);

    let ecipherKeys =Object.keys(eciperTemplate)
     let twoFARequiredMethods= new Array();

    for(let i=0;i<ecipherKeys.length;i++){
       if(isBoolean(eciperTemplate[ecipherKeys[i]])&&ecipherKeys[i]!='regenerateCipher'&&ecipherKeys[i]!='secretQuestionAndAnswers'){
        let key_val={}
        key_val[ecipherKeys[i]]=eciperTemplate[ecipherKeys[i]];
        twoFARequiredMethods.push(key_val)
       }
    }
    response.twoFARequiredMethods=twoFARequiredMethods


    return response;
}
function isBoolean (value) {
    return typeof value === 'boolean';
    };
module.exports = {
    responseObject: responseObject
}