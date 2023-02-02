const mysql = require('mysql');
const { CONSTANTS } = require('../../constants/StringConstants');
require("dotenv").config();

const connection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    port: process.env.DATABSE_PORT,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
});

connection.connect(function (err) {
    if (err) throw err;
    console.log(CONSTANTS.DATABASE_CONNECTED);
});

module.exports = connection;