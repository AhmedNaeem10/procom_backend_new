const { CONSTANTS, PAYMENT, connection } = require('../index')

exports.getCompetitions = (req, res) => {
    try {
        const sql = 'SELECT * FROM competition';
        connection.query(sql, (err, results) => {
            if (err) {
                res.json({ code: 400, data: err.message });
            } else {
                res.json({ code: 400, data: results });
            }
        });
    } catch (err) {
        res.json({ code: 400, data: err.message });
    }
}

exports.getACompetition = (req, res) => {
    try {
        const { compid } = req.params;
        const sql = `SELECT * FROM competition WHERE compid=${compid}`;
        connection.query(sql, (err, results) => {
            if (err) {
                res.json({ code: 400, data: err.message });
            } else {
                res.json({ code: 200, data: results[0] });
            }
        });
    } catch (err) {
        res.json({ code: 400, data: err.message });
    }
}