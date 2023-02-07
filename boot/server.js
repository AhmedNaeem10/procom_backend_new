const express = require("express");
const { initializeApp } = require("firebase/app");
const { boot } = require('../utils/utils');
const cors = require('cors');
const { login, register, getUser, teamRegister, getUsers, getUserCompetitions, getUserByEmail } = require('../controllers/user');
const { getAmbassadorDetails, isPaymentCollected, collectPayment } = require('../controllers/ambassador');
const { getCompetitions } = require('../controllers/competition');

const { firebaseConfig } = require('../database/firebase/FirebaseConfig');
const { getACompetition } = require("../controllers/competition");
initializeApp(firebaseConfig);

require("dotenv").config();

const app = express();

app.use(express.json());

app.use(cors({
    origin: '*'
}));

app.post('/login', login);

app.post('/register', register);

app.get('/user/:uid', getUser);

app.post('/teamRegister', teamRegister);

app.get('/allUsers', getUsers);

app.get('/ambassadorsData', getAmbassadorDetails);

app.put('/collectPayment', collectPayment);

app.put('/paymentCollected/:ambassador_id', isPaymentCollected);

app.get('/getUserCompetitions/:userid', getUserCompetitions);

app.get('/getCompetitions', getCompetitions)

app.get('/getACompetition/:compid', getACompetition);

app.post('/getUserByEmail', getUserByEmail);

app.listen(process.env.PORT, boot);