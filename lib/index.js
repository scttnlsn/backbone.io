var socketio = require('socket.io');

exports.listen = function(server, backends, options) {
    // Configure default options
    options || (options = {});
    options.event || (options.event = 'backend');

    var io = socketio.listen(server);

    // Serve client-side code
    io.static.add('/backbone.io.js', { file: __dirname + '/browser.js' });
    
    // Perform the sync on the given socket and backend
    var sync = function(socket, backend, method, model, callback) {
        backends[backend][method](model, function(err, resp) {
            callback(err, resp);
            if (!err) {
                socket.broadcast.emit('synced', method, resp);
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