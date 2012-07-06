(function() {
    var socket;
    var origSync = Backbone.sync;

    Backbone.io = Backbone.io || {};
    if (Backbone.io.constructor.toString().indexOf('SocketNamespace') !== -1) {
        socket = Backbone.io;
    } else {
        socket = io.connect(Backbone.io.host || null, Backbone.io.details || false);
    }

    Backbone.getSocket = function() {
        return socket;
    };
    
    Backbone.sync = function(method, model, options) {
        var backend = model.backend || (model.collection && model.collection.backend);
        
        options = _.clone(options);

        var error = options.error || function() {};
        var success = options.success || function() {};
        
        if (backend) {
            // Don't pass the callbacks to the backend
            delete options.error;
            delete options.success;
            
            // Use Socket.IO backend
            backend.ready(function() {
                var req = {
                    method: method,
                    channel: backend.channel || null,
                    model: model.toJSON(),
                    options: options
                };
                
                backend.socket.emit('sync', req, function(err, resp) {
                    if (err) {
                        error(err);
                    } else {
                        success(resp);
                    }
                });
            });
        } else {
            // Call the original Backbone.sync
            origSync(method, model, options);
        }
    };
    
    var Promise = function(obj) {
        var args = null;
        var callbacks = [];
        var resolved = false;
        
        this.add = function(callback) {
            if (resolved) {
                callback.apply(obj, args);
            } else {
                callbacks.push(callback);
            }
        },
        
        this.resolve = function() {
            if (!resolved) {
                args = arguments;
                resolved = true;
                
                var callback;
                while (callback = callbacks.shift()) {
                    callback.apply(obj, arguments);
                }
                
                callbacks = null;
            }
        }
    };
    
    var inherit = function(Parent, Child, mixins) {
        var Func = function() {};
        Func.prototype = Parent.prototype;

        mixins || (mixins = [])
        mixins.forEach(function(mixin) {
            _.extend(Func.prototype, mixin);
        });

        Child.prototype = new Func();
        Child.prototype.constructor = Child;

        return _.extend(Child, Parent);
    };
    
    var buildBackend = function(collection) {
        var options = collection.backend;
        var promise = new Promise(collection);
        var channel = undefined;
        
        if (typeof options === 'string') {
            var name = options;
        } else {
            var name = options.name;
            var channel = options.channel;
        }
        
        var backend = {
            name: name,
            channel: channel,
            socket: socket.of(name),
            options: null,
            ready: promise.add
        };
        
        backend.socket.emit('listen', backend.channel, function(options) {
            backend.options = options;    

            backend.socket.on('synced', function(method, resp, channel) {
                var event = backend.options.event;

                if (channel && channel !== backend.channel) {
                    return;
                }

                collection.trigger(event, method, resp);
                collection.trigger(event + ':' + method, resp);
            });
            
            promise.resolve();
        });
        
        return backend;
    };
    
    var Helpers = {
        // Listen for backend notifications and update the
        // collection models accordingly.
        bindBackend: function() {
            var self = this;
            var idAttribute = this.model.prototype.idAttribute;
            
            this.backend.ready(function() {
                var event = self.backend.options.event;
                
                self.bind(event + ':create', function(model) {
                    self.add(model);
                });
                self.bind(event + ':update', function(model) {
                    var item = self.get(model[idAttribute]);
                    if (item) item.set(model);
                });
                self.bind(event + ':delete', function(model) {
                    self.remove(model[idAttribute]);
                });
            });
        }  
    };
    
    Backbone.Collection = (function(Parent) {
        // Override the parent constructor
        var Child = function() {
            if (this.backend) {
                this.backend = buildBackend(this);
            }
            
            Parent.apply(this, arguments);
        };
        
        // Inherit everything else from the parent
        return inherit(Parent, Child, [Helpers]);
    })(Backbone.Collection);

})();