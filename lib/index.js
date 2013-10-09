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

    var io = socketio.listen(server);

    // Serve client-side code
    io.static.add('/backbone.io.js', { file: __dirname + '/browser.js' });
    setupSync(io, backends, options);

    return io;
};

var setupSync = exports.setupSync = function(io, backends, options) {
    options || (options = {});

    // Listen for backend syncs
    Object.keys(backends).forEach(function(backend) {
        io.of(backend).on('connection', function(socket) {
            var sync = new Sync(backend, socket, options);

            socket.on('listen', function(channel, callback) {
                if (channel) {
                    socket.set('channel', channel, function() {
                        socket.join(channel);
                        callback(options);
                    });
                } else {
                    callback(options);
                }
            });

            socket.on('sync', function(req, callback) {
                socket.get('channel', function(err, channel) {
                    req.channel = channel;

                    sync.handle(backends[backend], req, function(err, result) {
                        callback(err, result);

                        if (!err && req.method !== 'read') {
                            if (err) return;

                            if (channel) {
                                socket.broadcast.to(channel).emit('synced', req.method, result);
                            } else {
                                socket.broadcast.emit('synced', req.method, result);
                            }
                        }
                    });
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
