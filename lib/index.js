var fs = require('fs');
var path = require('path');
var socketio = require('socket.io');
var _ = require('underscore');
var backend = require('./backend');

exports.createBackend = function() {
    function that(req, res, callback) { that.handle(req, res, callback); }
    _.extend(that, backend);
    that.stack = [];
    return that;
};

exports.listen = function(server, backends, options) {
    // Configure default options
    options || (options = {});
    options.event || (options.event = 'backend');

    var io = socketio.listen(server);

    // Serve client-side code
    io.static.add('/backbone.io.js', { file: __dirname + '/browser.js' });
    
    // Perform the sync on the given socket and backend
    var sync = function(socket, backend, method, model, callback) {
        var ended = false;
        
        var req = {
            backend: backend,
            method: method,
            model: model,
            socket: socket
        };
        
        var res = {
            end: function(resp) {
                if (ended) return;
                ended = true;
                callback(null, resp);
                socket.broadcast.emit('synced', method, resp);
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
            
            socket.on('sync', function(method, model, callback) {
                sync(socket, backend, method, model, callback);
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