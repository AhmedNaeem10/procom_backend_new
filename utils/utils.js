exports.boot = () => {
    console.log('Server is alive!');
}

exports.check = (req, res) => {
    res.json('Server is alive!');
}