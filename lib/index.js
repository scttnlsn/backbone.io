var fs = require('fs');
var path = require('path');
var socketio = require('socket.io');
var Backend = require('./backend');
var Sync = require('./sync');

exports.Backend = Backend;

exports.createBackend = function() {
    return new Backend();
};

exports.listen = function(server, backends, options) {
    // Configure default options
    options || (options = {});
    options.event || (options.event = 'backend');

    var io = socketio(server);

    var clientSource = fs.readFileSync(path.join(__dirname, '/browser.js'), 'utf8')

    // Serve client-side code
    var events = server.listeners('request').slice(0);
    server.removeAllListeners('request');
    server.on('request', function(req, res) {
        if (0 == req.url.indexOf('/socket.io/backbone.io.js')) {
            res.setHeader('Content-Type', 'application/javascript');
            res.writeHead(200);
            res.end(clientSource);
        } else {
            for (var i = 0; i < events.length; i++) {
                events[i].call(server, req, res);
            }
        }
    });
    setupSync(io, backends, options);

    return io;
};

var setupSync = exports.setupSync = function(io, backends, options) {
    options || (options = {});

    // Listen for backend syncs
    Object.keys(backends).forEach(function(backend) {
        io.of('/' + backend).on('connection', function(socket) {
            var sync = new Sync(backend, socket, options);

            socket.on('listen', function(channel, callback) {
                if (channel) {
                    socket.channel = channel;
                    socket.join(channel);
                }
                callback(options);
            });

            socket.on('sync', function(req, callback) {
                req.channel = socket.channel;

                sync.handle(backends[backend], req, function(err, result) {
                    callback(err, result);

                    if (req.method !== 'read') {
                        if (socket.channel) {
                            socket.broadcast.to(socket.channel).emit('synced', req.method, result);
                        } else {
                            socket.broadcast.emit('synced', req.method, result);
                        }
                    }
                });
            });

            // Proxy events on the backend to the socket
            var events = { 'created': 'create', 'updated': 'update', 'deleted': 'delete' };
            Object.keys(events).forEach(function(event) {
                var listener = function(model) {
                    socket.emit('synced', events[event], model);
                };

                backends[backend].on(event, listener);

                socket.on('disconnect', function() {
                    backends[backend].removeListener(event, listener);
                });
            });
        });
    });

    return io;
};

exports.middleware = {};

fs.readdirSync(path.dirname(__dirname) + '/middleware').forEach(function(filename) {
    var name = path.basename(filename, '.js');
    exports.middleware.__defineGetter__(name, function() {
        return require('../middleware/' + name);
    });
});
