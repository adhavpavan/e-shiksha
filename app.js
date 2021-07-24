'use strict';
const express = require('express');
const {
    sequelize
} = require('./src/db/db');
const app = express();
var port = process.env.PORT || 4000;
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

sequelize.authenticate().then(message => {
    console.log(message)
    app.listen(port);
    console.log(`Server is running ${port}`);
}).catch(err => {
    console.log(err)
})





module.exports = app;