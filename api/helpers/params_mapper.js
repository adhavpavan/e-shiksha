// Purpose : map every key to its value

var map = (req) =>
    Object.keys(req.params).reduce((prev, curr) => {
        prev[curr] = req.params[curr].value;
        return prev;
    }, {});

module.exports = { map: map };