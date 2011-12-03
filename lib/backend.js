var _ = require('underscore');

exports.use = function() {
    var context = ['all'];
    var args = [].slice.call(arguments);
    
    var middleware = args.pop();
    if (args.length) {
        context = args;
    }
    
    this.stack.push({ context: context, middleware: middleware });
    return this;
};

exports.handle = function(req, res, callback) {
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
        
        if (_.include(layer.context, req.method) || _.include(layer.context, 'all')) {
            // Call this layer's middleware
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
            next();
        }
    };
    
    next();
};

_.each(['create', 'read', 'update', 'delete'], function(context) {
    exports[context] = function(middleware) {
        return exports.use.call(this, context, middleware);
    };
});