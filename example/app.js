var express     = require('express'),
    backboneio  = require('../lib/index'),
    app         = express.createServer();

app.use(express.static(__dirname));
app.listen(3000);
console.log('http://localhost:3000/');

backboneio.connect(app, { messages: new backboneio.Backend() });