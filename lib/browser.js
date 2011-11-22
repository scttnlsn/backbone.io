(function() {
    var socket = io.connect();
    var origSync = Backbone.sync;
    
    Backbone.sync = function(method, model, options) {
        var backend = model.backend || model.collection.backend;
        
        if (backend) {
            // Use Socket.IO backend
            backend.ready(function() {
                backend.socket.emit('sync', method, model.toJSON(), function(err, resp) {
                    if (err) {
                        options.error(err);
                    } else {
                        options.success(resp);
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
        var name = collection.backend;
        var promise = new Promise(collection);
        
        var backend = {
            name: name,
            socket: socket.of(name),
            options: null,
            ready: promise.add
        };
        
        backend.socket.emit('listen', function(options) {
            backend.options = options;    

            backend.socket.on('synced', function(method, resp) {
                var event = backend.options.event;

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
                    self.get(model[idAttribute]).set(model);
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