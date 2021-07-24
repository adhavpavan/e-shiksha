var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;
var LdapStrategy = require('passport-ldapauth');


var OPTS = {
    server: {
        url: 'ldap://ldap.religare.in:389',
        bindDn: 'CN=Capiot1 .,OU=Religare Securities Noida,dc=religare,dc=in',
        bindCredentials: 'mail@123',
        searchBase: 'dc=religare,dc=in',
        searchFilter: '(sAMAccountName={{username}})',
        searchAttributes: ['displayName', 'mail', 'objectClass', 'memberOf']
    }
};

passport.use('local', new LocalStrategy((username, password,done) => {    
    if (username == "q" && password == "q") {        
        done(null, { username: username });
    } else {
        done(null,false,{ message: "Incorrect Login / Password" });
    }
}
));

passport.use('ldapauth', new LdapStrategy(OPTS, function (user, done) {
    done(null, user);
}));


passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

module.exports = {};