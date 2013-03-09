var express = require('express');
var backboneio = require('../lib/index');
var mongoose = require('mongoose');

var app = express.createServer();
app.use(express.static(__dirname));

app.listen(3000);
console.log('http://localhost:3000/');

var messages = backboneio.createBackend();

mongoose.connect('localhost', 'backboneio-test');

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

var messageSchama = mongoose.Schema({text: 'string'});
var MessageModel = mongoose.model('Message', messageSchama);

db.once('open', function callback () {
	messages.use(backboneio.middleware.mongooseStore(MessageModel));

	backboneio.listen(app, { messages: messages });
})
