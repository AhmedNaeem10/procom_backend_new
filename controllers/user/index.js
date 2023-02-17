const { createUserWithEmailAndPassword, sendEmailVerification, getAuth, signInWithEmailAndPassword, deleteUser } = require('firebase/auth');
const { CONSTANTS, PAYMENT, connection } = require('../index')
const { sendEmail } = require('../../emailService');
const axios = require("axios");

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
                        res.json({ code: 200, data: { token, isVerified, ...result[0] } })
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
        const { email, password, contact, university, fullname, isAmbassador } = req.body;
        const auth = getAuth();
        createUserWithEmailAndPassword(auth, email, password)
            .then(async (cred) => {
                if(!isAmbassador){
                    await sendEmailVerification(cred.user)
                    .catch((err) => {
                        res.json({ code: 400, data: err.message })
                    })
                }
            const sql = `INSERT INTO User(fullname, contact, email, university, isAmbassador) VALUES('${fullname}', '${contact}', '${email}', '${university}', ${isAmbassador});`;
            connection.query(sql, async (err, result) => {
                if (err) {
                    res.json({ code: 400, data: err.message });
                    deleteUser(cred.user);
                } else {
                    if(isAmbassador){
                        const subject = "Procom'23 Brand Ambassador Account Credentials";
                        const body = `Dear ${fullname},

We hope this email finds you well. We are thrilled to have you as a brand ambassador for our upcoming event, Procom'23. As a brand ambassador, you play a crucial role in promoting and spreading the word about our event.
                        
We have created a user account for you, which will provide you with exclusive access to our brand ambassador resources and tools. You can use these resources to easily promote Procom'23 on your social media platforms and other online channels.
                        
Your login credentials are as follows:

Username: ${email}
Password: ${password}
                        
Please use these credentials to log in to your brand ambassador account. If you have any trouble accessing your account, please don't hesitate to reach out to us at procom.net@nu.edu.pk.

We are looking forward to working with you and making Procom'23 a huge success. Thank you for your support and dedication to our event!

Best regards,
Procom'23 Organizing Committee`;
                        await sendEmail(email, subject, body);
                        res.json({ code: 200, data: CONSTANTS.REGISTRATION_SUCCESS });
                    }else{
                        res.json({ code: 200, data: CONSTANTS.REGISTRATION_SUCCESS });
                    }
                }
            });
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
        let sql = `INSERT INTO team(numofmembers, teamname, teamlead) VALUES(${numOfMembers}, '${teamName}', '${teamLead}');`;
        connection.query(sql, (err, result) => {
            if (err) {
                connection.rollback();
                res.json({ code: 400, data: err.message })
            } else {
                sql = `INSERT INTO payment(paymentstatus, paymentmethod, paymentreference, competitionid, teamLead) VALUES('${PAYMENT.PENDING}', '${paymentMethod}', '${paymentReference}', '${compId}', ${teamLead});`;
                connection.query(sql, (err, result) => {
                    if (err) {
                        connection.rollback();
                        res.json({ code: 400, data: err.message })
                    } else {
                        sql = `INSERT INTO registrations(totalfee, competitionid, teamlead, qrcode) VALUES(${totalFee}, '${compId}', ${teamLead}, ${'QRCODE'});`
                        connection.query(sql, async (err, result) => {
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
                                            sql = `SELECT * FROM ambassador_payment WHERE ambassador_id=${ambassador_id}`
                                            connection.query(sql, (err, result) => {
                                                if (err) {
                                                    connection.rollback();
                                                    res.json({ code: 400, data: err.message })
                                                } else {
                                                    if (!result.length) {
                                                        sql = `INSERT INTO ambassador_payment VALUES(${ambassador_id}, 0)`;
                                                        connection.query(sql, (err, result) => {
                                                            if (err) {
                                                                connection.rollback();
                                                                res.json({ code: 400, data: err.message })
                                                            }
                                                        })
                                                    }
                                                    sql = `UPDATE ambassador_payment SET amount = amount + ${totalFee < 800 ? totalFee*numOfMembers : totalFee} WHERE ambassador_id=${ambassador_id}`;
                                                    connection.query(sql, async (err, result) => {
                                                        if (err) {
                                                            connection.rollback();
                                                            res.json({ code: 400, data: err.message })
                                                        } else {
                                                            sql = `SELECT * from User where userid=${teamLead}`;
                                                            connection.query(sql, async (err, result)=>{
                                                                if (err) {
                                                                    connection.rollback();
                                                                    res.json({ code: 400, data: err.message })
                                                                }else{
                        //                                             const subject = "Procom'23 Team Registration";
                        //                                             const body = `Dear Team ${teamName},
                        
                        // We hope this email finds you well. On behalf of the ProCom team, we would like to formally confirm your successful registration for ProCom 2023.
                        
                        // Your participation in this event is greatly appreciated and we are looking forward to having you join us. As a reminder, ProCom 2023 will be held on 9th & 10th March 2023.
                        
                        // If you have any questions or concerns, please do not hesitate to reach out to us at procom.net@nu.edu.pk
                        
                        // We look forward to seeing you soon!
                        
                        // Best regards,
                        // Procom'23 Organizing Committee`;
                        
                        //                                             await sendEmail(result[0].email, subject, body);
                                                                    const Email = result[0].email;
                                                                    const Name = result[0].fullname;
                                                                    sql = `SELECT * FROM competition WHERE compid='${compId}'`
                                                                    connection.query(sql, async (err, result)=>{
                                                                        if(err){
                                                                            connection.rollback();
                                                                            res.json({code: 400, data: err.message});
                                                                        }else{
                                                                            let response = await axios.post("http://fouzanasif.pythonanywhere.com/mail", {Email, Name, TName: teamName, Participants: numOfMembers, Competitions: result[0].compname, HeadComp: result[0].CompType});
                                                                            connection.commit();
                                                                            res.json({ code: 200, data: CONSTANTS.TEAM_REGISTRATION })
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                } else {
                                    sql = `SELECT email from User where userid=${teamLead}`;
                                    connection.query(sql, async (err, result)=>{
                                        if (err) {
                                            connection.rollback();
                                            res.json({ code: 400, data: err.message })
                                        }else{
//                                             const subject = "Procom'23 Team Registration";
//                                             const body = `Dear Team ${teamName},

// We hope this email finds you well. On behalf of the ProCom team, we would like to formally confirm your successful registration for ProCom 2023.

// Your participation in this event is greatly appreciated and we are looking forward to having you join us. As a reminder, ProCom 2023 will be held on 9th & 10th March 2023.

// If you have any questions or concerns, please do not hesitate to reach out to us at procom.net@nu.edu.pk

// We look forward to seeing you soon!

// Best regards,
// Procom'23 Organizing Committee`;

//                                             await sendEmail(result[0].email, subject, body);
                                            const Email = result[0].email;
                                            const Name = result[0].fullname;
                                            sql = `SELECT * FROM competition WHERE compid='${compId}'`
                                            connection.query(sql, async (err, result)=>{
                                                if(err){
                                                    connection.rollback();
                                                    res.json({code: 400, data: err.message});
                                                }else{
                                                    let response = await axios.post("http://fouzanasif.pythonanywhere.com/mail", {Email, Name, TName: teamName, Participants: numOfMembers, Competitions: result[0].compname, HeadComp: result[0].CompType});
                                                    connection.commit();
                                                    res.json({ code: 200, data: CONSTANTS.TEAM_REGISTRATION })
                                                }
                                            })
                                        }
                                    })
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
        const sql = `SELECT * FROM User U INNER JOIN team T ON U.userid = T.teamlead INNER JOIN registrations R ON T.teamlead = R.teamlead INNER JOIN competition C ON R.competitionid = C.compid WHERE U.userid = ${userid};`;
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