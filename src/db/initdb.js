const config = require('../config/db.conf');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
    // create db if it doesn't already exist
    const {  HOST,DB,USER,PASSWORD} = config;
    const connection = await mysql.createConnection({ HOST, USER, PASSWORD });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB}\`;`);

    // connect to db
    const sequelize = new Sequelize(DB, USER, PASSWORD, { dialect: 'mysql' });

    // init models and add them to the exported db object
    db.User = require('../users/user.model')(sequelize);

    // sync all models with database
    await sequelize.sync();
}