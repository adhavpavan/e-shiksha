module.exports = {
  SECRET: 'ASDAKJFAFA,MDASKFAKFSA;AFLAFADAKJ',
  OFFLINE_TOKEN_EXPIRY: 60,
  MONGO: {
    URL: 'mongodb://localhost:27017/identity',
  },
  // smtpConfig: {
  //   host: 'smtp.gmail.com',
  //   port: 587,
  //   secure: false, // true for 465, false for other ports
  //   auth: {
  //     user: 'sandippawarm@gmail.com', // generated ethereal user
  //     pass: '2010bit017', // generated ethereal password
  //   },
  // },
  NODEMAILER: {
    host: 'smtp.gmail.com',
    // port: config.MAILER.PORT,
    secure: true,
    auth: {
      user: 'sandippawarm@gmail.com',
      pass: '2010bit017',
    },
  },
  MAILER: {
    FROM: 'sandippawar96@gmail.com',
    SUBJECT: 'Welcome to RELIGARE',
  },
  FORGOTPASSWORDURL: 'http://localhost:4000/api/v1/resetPwd?key=',
  EMAILTEMPLATES: {
    WELCOME: {
      PATH: './user/app/emailTemplates/welcome.html',
      TITLE: 'RELIGARE Admin',
      SUBJECT: 'RELIGARE Admin',
    },
    FORGOTPASSWORD: {
      PATH: './emailTemplates/forgotpassword.html',
      TITLE: 'Eshiksha Admin',
      SUBJECT: 'Eshiksha Admin',
    },
    FORGOTUSERID: {
      PATH: './user/app/emailTemplates/forgotUserId.html',
      TITLE: 'RELIGARE Admin',
      SUBJECT: 'RELIGARE Admin',
    },
    PASSWORDACCOUNTLOCK: {
      PATH: './user/app/emailTemplates/accountLockPassword.html',
      TITLE: 'RELIGARE Admin',
      SUBJECT: 'RELIGARE Admin',
    },
    SECURITYACCOUNTLOCK: {
      PATH: './user/app/emailTemplates/accountLockSecurity.html',
      TITLE: 'RELIGARE Admin',
      SUBJECT: 'RELIGARE Admin',
    },
    ACCOUNTUNLOCK: {
      PATH: './user/app/emailTemplates/accountUnlock.html',
      TITLE: 'RELIGARE Admin',
      SUBJECT: 'RELIGARE Admin',
    },
    RESETPASSWORD: {
      PATH: './api/emailTemplates/userReset.html',
      TITLE: 'Eshiksha Admin',
      SUBJECT: 'Eshiksha Admin',
    },
  },
};
