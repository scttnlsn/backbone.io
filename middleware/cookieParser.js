var cookie = require('cookie');

module.exports = function(secret) {
    return function(req, res, next) {
        var value = req.socket.handshake.headers.cookie;
        req.cookies = {};
        
        if (value) {
            req.cookies = cookie.parse(value);
        }
        
        next();
    };
};