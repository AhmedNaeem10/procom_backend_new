const { CONSTANTS, PAYMENT, connection } = require('../index')

exports.getAmbassadorDetails = (req, res) => {
    try {
        const sql = 'SELECT A.ambassador_id, U.fullname, U.contact, COUNT(A.ambassador_id) as teams_registered, SUM(R.totalfee) as total_fee, MIN(collected) as payment_collected FROM User U LEFT OUTER JOIN ambassador_data A ON U.userid = A.ambassador_id LEFT OUTER JOIN registrations R ON A.reg_id = R.regid GROUP BY A.ambassador_id;';
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

exports.paymentCollected = (req, res) => {
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