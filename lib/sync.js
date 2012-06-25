var EventEmitter = require('events').EventEmitter;

module.exports = Sync;

function Sync(backend, socket, options) {
    this.backend = backend;
    this.socket = socket;
    this.options = options || {};
};

Sync.prototype.init = function(req, responder) {
    var self = this;
    
    req.backend = this.backend;
    req.socket = this.socket;
    
    return {
        end: function(result) {
            responder.emit('respond', null, result);
        },
        error: function(err) {
            responder.emit('respond', err);
        }
    };
};

Sync.prototype.error = function(err) {
    var result = {
        error: { name: err.name, message: err.message }
    };

    for (var key in err) {
        result.error[key] = err[key];
    }
    
    if (this.options.debug) {
        result.error.stack = err.stack;
    }
    
    return result;
};

Sync.prototype.handle = function(backend, req, callback) {
    var self = this;
    var responder = new EventEmitter();
    var res = this.init(req, responder);
    
    responder.once('respond', function(err, result) {
        if (err) {
            callback(self.error(err));
        } else {
            callback(null, result);
        }
    });
    
    backend.handle(req, res, function(err) {
        if (err) responder.emit('respond', err);
    });
};