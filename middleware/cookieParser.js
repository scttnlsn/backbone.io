module.exports = function() {
    return function(req, res, next) {
        var cookie = req.socket.handshake.headers.cookie;
        req.cookies = {};
        
        if (cookie) {
            req.cookies = parseCookie(cookie);
        }
        
        next();
    };
};

// Stolen from Connect (lib/utils.js)
function parseCookie(str) {
    var obj = {};
    var pairs = str.split(/[;,] */);
    
    for (var i = 0, len = pairs.length; i < len; ++i) {
        var pair = pairs[i];
        var eqlIndex = pair.indexOf('=');
        var key = pair.substr(0, eqlIndex).trim();
        var val = pair.substr(++eqlIndex, pair.length).trim();

        if ('"' == val[0]) {
            val = val.slice(1, -1);
        }

        if (undefined == obj[key]) {
            val = val.replace(/\+/g, ' ');
            
            try {
                obj[key] = decodeURIComponent(val);
            } catch (err) {
                if (err instanceof URIError) {
                    obj[key] = val;
                } else {
                    throw err;
                }
            }
        }
    }
    
    return obj;
};