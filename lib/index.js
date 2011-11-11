var socketio = require('socket.io');

exports.Backend = require('./backend');

exports.connect = function(listen, backends, options) {
    // Configure default options
    options || (options = {});
    options.event || (options.event = 'backend');

    var io = socketio.listen(listen);

    // Serve client-side code
    io.static.add('/backbone.io.js', { file: __dirname + '/browser.js' });
    
    // Listen for backend syncs
    Object.keys(backends).forEach(function(backend) {
        io.of(backend).on('connection', function(socket) {
            socket.on('sync', function(method, model, callback) {
                var resp = backends[backend][method](model);
                callback(resp);
                
                if (resp) {
                    socket.broadcast.emit('synced', options.event, method, resp);
                }
            });
        });  
    });
    
    return io;
};