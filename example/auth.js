var connect     = require('connect'),
    express     = require('express'),
    backboneio  = require('../lib/index'),
    app         = express.createServer();
    
var sessions = new express.session.MemoryStore();

app.use(express.static(__dirname));
app.use(express.cookieParser());
app.use(express.session({ secret: 'mysecret', store: sessions }));

app.get('/login', function(req, res) {
    req.session.user = 'myuser';
    res.redirect('/');
});

app.get('/logout', function(req, res) {
    req.session.user = undefined;
    res.redirect('/');
});

app.listen(3000);
console.log('http://localhost:3000/');

var Backend = require('../backends/memory');
var io = backboneio.listen(app, { messages: new Backend() });
    
io.set('authorization', function(handshake, callback) {
    var authorize = function(authorized) {
        callback(authorized ? null : 'Not authorized', authorized);
    };

    if (handshake.headers.cookie) {
        var cookie = connect.utils.parseCookie(handshake.headers.cookie);
        sessions.get(cookie['connect.sid'], function(err, session) {
            if (!err && session) {
                if (session.user !== undefined) {
                    return authorize(true);
                }
            }
            return authorize(false);
        });
    } else {
        authorize(false);
    }
});