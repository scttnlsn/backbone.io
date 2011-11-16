var express     = require('express'),
    backboneio  = require('../lib/index'),
    app         = express.createServer();

app.use(express.static(__dirname));
app.listen(3000);
console.log('http://localhost:3000/');

var Backend = require('../backends/memory');
backboneio.listen(app, { messages: new Backend() });