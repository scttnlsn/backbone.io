var fs = require('fs');
var path = require('path');
var socketio = require('socket.io');
var Backend = require('./backend');

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
    
    // Perform the sync on the given socket and backend
    var sync = function(socket, backend, req, callback) {
        var ended = false;
        
        req.socket = socket;
        req.backend = backend;
        
        var res = {
            end: function(resp) {
                if (ended) return;
                ended = true;
                callback(null, resp);
                socket.broadcast.emit('synced', req.method, resp);
            }
        };
        
        backends[backend].handle(req, res, function(err) {
            if (err) {
                var resp = { error: err.name, message: err.message };
                if (options.debug) {
                    console.log(err);
                    resp.stack = err.stack;
                }
                callback(resp);
            }
        });
    };
    
    // Listen for backend syncs
    Object.keys(backends).forEach(function(backend) {
        io.of(backend).on('connection', function(socket) {
            socket.on('listen', function(callback) {
                callback(options);
            });
            
            socket.on('sync', function(req, callback) {
                sync(socket, backend, req, callback);
            });
            
            backends[backend].on('synced', function(method, resp) {
                socket.emit('synced', method, resp);
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