var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

module.exports = Backend;

function Backend() {
    this.stack = [];
};

inherits(Backend, EventEmitter);

Backend.prototype.use = function() {
    var context = ['all'];
    var args = [].slice.call(arguments);
    
    var middleware = args.pop();
    if (args.length) {
        context = args;
    }
    
    this.stack.push({ context: context, middleware: middleware });
    return this;
};

Backend.prototype.handle = function(req, res, callback) {
    var self = this;
    var index = 0;
    
    function next(err) {
        var layer = self.stack[index++];
        
        // Reached the bottom of the middleware stack
        if (!layer) {
            if (err) return callback(err);
            
            // Respond with the requested model by default
            return res.end(req.model);
        }
        
        var layerIncludes = function(context) {
            return layer.context.indexOf(context) !== -1;
        };

        // Only call this layer's middleware if it applies for the
        // current context.
        if (layerIncludes(req.method) || layerIncludes('all')) {
            try {
                if (err) {
                    if (layer.middleware.length === 4) {
                        layer.middleware(err, req, res, next);
                    } else {
                        next(err);
                    }
                } else {
                    layer.middleware(req, res, next);
                }
            } catch (err) {
                next(err);
            }
        } else {
            next(err);
        }
    };
    
    next();
};

['create', 'read', 'update', 'delete'].forEach(function(context) {
    Backend.prototype[context] = function(middleware) {
        return Backend.prototype.use.call(this, context, middleware);
    };
});