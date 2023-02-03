const { createUserWithEmailAndPassword, sendEmailVerification, getAuth, signInWithEmailAndPassword, sign } = require('firebase/auth');
const { CONSTANTS, PAYMENT, connection } = require('../index')

exports.login = (req, res) => {
    try {
        const { email, password } = req.body;
        const auth = getAuth();
        signInWithEmailAndPassword(auth, email, password)
            .then(async (cred) => {
                const token = await cred.user.getIdToken();
                const isVerified = cred.user.emailVerified;
                const sql = `SELECT * FROM User where email='${email}';`;
                connection.query(sql, (err, result) => {
                    if (err) {
                        res.json({ code: 400, data: err.message });
                    } else {
                        res.json({ code: 200, data: {token, isVerified, ...result[0]} })
                    }
                });
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
                        const sql = `INSERT INTO User(fullname, contact, email, university) VALUES('${fullname}', '${contact}', '${email}', '${university}');`;
                        connection.query(sql, (err, result) => {
                            if (err) {
                                res.json({ code: 400, data: err.message });
                            } else {
                                res.json({ code: 200, data: CONSTANTS.REGISTRATION_SUCCESS });
                            }
                        });
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
    try {
        const { uid } = req.params;
        const sql = `SELECT * FROM User WHERE userid='${uid}'`;
        connection.query(sql, (err, result) => {
            if (err) throw err;
            res.json({ code: 200, data: result[0] })
        });
    } catch (err) {
        res.json({ code: 400, data: err.message })
    }
}

exports.getUsers = (req, res) => {
    try {
        const sql = `SELECT * FROM User`;
        connection.query(sql, (err, result) => {
            if (err) throw err;
            res.json({ code: 200, data: result })
        });
    } catch (err) {
        res.json({ code: 400, data: err.message })
    }
}

exports.teamRegister = (req, res) => {
    try {
        const { teamLead, teamName, numOfMembers, compId, totalFee, paymentMethod, paymentReference, ambassador_id } = req.body;
        connection.beginTransaction();
        let sql = `INSERT INTO team VALUES(${numOfMembers}, '${teamName}', '${teamLead}');`;
        connection.query(sql, (err, result) => {
            if (err) {
                connection.rollback();
                res.json({ code: 400, data: err.message })
            } else {
                sql = `INSERT INTO payment VALUES('${PAYMENT.PENDING}', '${paymentMethod}', '${paymentReference}', ${compId}, ${teamLead});`;
                connection.query(sql, (err, result) => {
                    if (err) {
                        connection.rollback();
                        res.json({ code: 400, data: err.message })
                    } else {
                        sql = `INSERT INTO registrations(totalfee, competitionid, teamlead, qrcode) VALUES(${totalFee}, ${compId}, ${teamLead}, ${'QRCODE'});`
                        connection.query(sql, (err, result) => {
                            if (err) {
                                connection.rollback();
                                res.json({ code: 400, data: err.message })
                            } else {
                                let regid = result.insertId;
                                if (ambassador_id) {
                                    sql = `INSERT INTO ambassador_data(ambassador_id, date_time, reg_id, collected) VALUES(${ambassador_id}, '${new Date().toISOString()}', ${regid}, false);`;
                                    connection.query(sql, (err, result) => {
                                        if (err) {
                                            connection.rollback();
                                            res.json({ code: 400, data: err.message })
                                        } else {
                                            connection.commit();
                                            res.json({ code: 200, data: CONSTANTS.TEAM_REGISTRATION })
                                        }
                                    });
                                } else {
                                    connection.commit();
                                    res.json({ code: 200, data: CONSTANTS.TEAM_REGISTRATION })
                                }
                            }
                        });
                    }
                })
            }
        })
    } catch (err) {
        res.json({ code: 400, data: err.message })
    }
}



exports.getUserCompetitions = (req, res) => {
    try {
        const { userid } = req.params;
        const sql = `SELECT * FROM User U INNER JOIN team T ON U.userid = T.teamlead INNER JOIN registrations R ON T.teamlead = R.competitionid INNER JOIN competition C ON R.teamlead = C.compid WHERE U.userid = ${userid};`;
        connection.query(sql, (err, results) => {
            if (err) {
                res.json({ code: 400, data: err.message });
            } else {
                res.json({ code: 200, data: results })
            }
        });
    } catch (err) {
        res.json({ code: 400, data: err.message });
    }
}

exports.getUserByEmail = (req, res) => {
    try {
        const { email } = req.body;
        const sql = `SELECT * FROM User where email='${email}';`;
        connection.query(sql, (err, result) => {
            if (err) {
                res.json({ code: 400, data: err.message });
            } else {
                res.json({ code: 200, data: result[0] })
            }
        });
    } catch (err) {
        res.json({ code: 400, data: err.message });
    }
}