var express = require('express');
var backboneio = require('../lib/index');

var app = express();
app.use(express.static(__dirname));

var server = app.listen(3000);
console.log('http://localhost:3000/');

var messages = backboneio.createBackend();
messages.use(backboneio.middleware.memoryStore());

backboneio.listen(server, { messages: messages });