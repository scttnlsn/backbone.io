var express = require('express');
var backboneio = require('../lib/index');

var app = express();

var session = {
    store: new express.session.MemoryStore(),
    secret: 'mysecret'
};

app.use(express.cookieParser());
app.use(express.session(session));
app.use(express.static(__dirname));

app.get('/login', function(req, res) {
    req.session.user = 'myuser';
    res.redirect('/');
});

app.get('/logout', function(req, res) {
    req.session.user = undefined;
    res.redirect('/');
});

var server = app.listen(3000);
console.log('http://localhost:3000/');

var auth = function(req, res, next) {
    if (!req.session.user) {
        next(new Error('Unauthorized'));
    } else {
        next();
    }
};

var messages = backboneio.createBackend();
messages.use(backboneio.middleware.cookieParser());
messages.use(backboneio.middleware.session(session));
messages.use('create', 'update', 'delete', auth);
messages.use(backboneio.middleware.memoryStore());

backboneio.listen(server, { messages: messages });