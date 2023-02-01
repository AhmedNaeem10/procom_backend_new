const { createUserWithEmailAndPassword, sendEmailVerification, getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { CONSTANTS } = require("../../constants/StringConstants")
const connection = require("../../database/mysql/MySqlConfig");

exports.login = (req, res) => {
    try {
        const { email, password } = req.body;
        const auth = getAuth();
        signInWithEmailAndPassword(auth, email, password)
            .then(async (cred) => {
                const token = await cred.user.getIdToken();
                res.json(token)
            })
            .catch((err) => {
                res.json({ code: 400, data: err.message })
            })
    } catch (err) {
        res.json({ code: 400, data: err.message })
    }
};

exports.register = (req, res) => {
    try {
        const { email, password, contact, university, fullname } = req.body;
        const auth = getAuth();
        createUserWithEmailAndPassword(auth, email, password)
            .then(async (cred) => {
                sendEmailVerification(cred.user)
                    .then(() => {
                        const sql = `INSERT INTO User VALUES('${cred.user.uid}', '${fullname}', '${password}', '${contact}', '${email}', '${university}');`;
                        connection.query(sql);
                        res.json({ code: 200, data: CONSTANTS.REGISTRATION_SUCCESS });
                    })
                    .catch((err) => {
                        res.json({ code: 400, data: err.message })
                    })
            })
            .catch((err) => {
                res.json({ code: 400, data: err.message })
            })
    } catch (err) {
        res.json({ code: 400, data: err.message })
    }
}

exports.getUser = (req, res) => {
    try{
        const {uid} = req.params;
        const sql = `SELECT * FROM User WHERE userid='${uid}'`;
        connection.query(sql, (err, result)=>{
            if (err) throw err;
            res.json({code: 200, data: result[0]})
        });
    }catch(err){
        res.json({ code: 400, data: err.message })
    }
}

