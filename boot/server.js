const express = require("express");
const { initializeApp } = require("firebase/app");
const { boot } = require('../utils/utils');
const { login, register, getUser } = require('../controllers/user/user');
const { firebaseConfig } = require('../database/firebase/FirebaseConfig');
initializeApp(firebaseConfig);

require("dotenv").config();

const app = express();

app.use(express.json(0));

app.post('/login', login);

app.post('/register', register);

app.get('/user/:uid', getUser);

app.listen(process.env.PORT, boot);