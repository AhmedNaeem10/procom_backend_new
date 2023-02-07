const { CONSTANTS, PAYMENT, connection } = require('../index')

exports.getAmbassadorDetails = (req, res) => {
    try {
        const sql = 'SELECT A.ambassador_id as id, U.fullname, U.email, U.contact, COUNT(A.ambassador_id) as teams_registered, AM.amount FROM User U INNER JOIN ambassador_data A ON U.userid = A.ambassador_id INNER JOIN registrations R ON A.reg_id = R.regid INNER JOIN ambassador_payment AM ON A.ambassador_id = AM.ambassador_id GROUP BY A.ambassador_id';
        connection.query(sql, (err, result) => {
            if (err) {
                res.json({ code: 400, data: err.message })
            } else {
                res.json({ code: 200, data: result })
            }
        })
    } catch (err) {
        res.json({ code: 400, data: err.message })
    }
}

exports.isPaymentCollected = (req, res) => {
    try {
        const { ambassador_id } = req.params;
        const sql = `UPDATE ambassador_data SET collected = true WHERE ambassador_id = ${ambassador_id}`;
        connection.query(sql, (err, result) => {
            if (err) {
                res.json({ code: 400, data: err.message })
            } else {
                res.json({ code: 200, data: "Payment status changed!" })
            }
        });
    } catch (err) {
        res.json({ code: 400, data: err.message });
    }
};

exports.collectPayment = (req, res) => {
    try {
        const { ambassador_id, amount } = req.body;
        const sql = `UPDATE ambassador_payment SET amount = amount - ${amount} WHERE ambassador_id = ${ambassador_id}`;
        connection.query(sql, (err, result) => {
            if (err) {
                res.json({ code: 400, data: err.message })
            } else {
                res.json({ code: 200, data: "Payment changed!" })
            }
        });
    } catch (err) {
        res.json({ code: 400, data: err.message });
    }
};