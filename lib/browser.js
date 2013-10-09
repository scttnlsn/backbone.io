(function() {
    var connected = new Promise();

    Backbone.io = Backbone.IO = {
        connect: function() {
            var socket = io.connect.apply(io, arguments);
            connected.resolve(socket);
            return socket;
        }
    };

    var origSync = Backbone.sync;

    Backbone.sync = function(method, model, options) {
        var backend = model.backend || (model.collection && model.collection.backend);

        options = _.clone(options) || {};

        var error = options.error || function() {};
        var success = options.success || function() {};

        if (backend) {
            // Don't pass these to server
            delete options.error;
            delete options.success;
            delete options.collection;

            // Use Socket.IO backend
            backend.ready(function() {
                var req = {
                    method: method,
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
            return origSync(method, model, options);
        }
    };

    var Mixins = {
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

    function addBackendBinding(Parent) {
        // Override the parent constructor
        var Child = function(models, options) {
            if (options && options.backend) {
                this.backend = options.backend;
            }
            if (this.backend) {
                this.backend = buildBackend(this);
            }

            Parent.apply(this, arguments);
        };

        // Inherit everything else from the parent
        return inherits(Parent, Child, [Mixins]);
    }

    Backbone.Collection = addBackendBinding(Backbone.Collection);
    Backbone.Model = addBackendBinding(Backbone.Model);

    // Helpers
    // ---------------

    function inherits(Parent, Child, mixins) {
        var Func = function() {};
        Func.prototype = Parent.prototype;

        mixins || (mixins = [])
        _.each(mixins, function(mixin) {
            _.extend(Func.prototype, mixin);
        });

        Child.prototype = new Func();
        Child.prototype.constructor = Child;

        return _.extend(Child, Parent);
    };

    function buildBackend(collection) {
        var ready = new Promise();
        var options = collection.backend;

        if (typeof options === 'string') {
            var name = options;
            var channel = undefined;
        } else {
            var name = options.name;
            var channel = options.channel;
        }

        var backend = {
            name: name,
            channel: channel,
            ready: function(callback) {
                ready.then(callback);
            }
        };

        connected.then(function(socket) {
            backend.socket = socket.of(name);

            backend.socket.emit('listen', backend.channel, function(options) {
                backend.options = options;

                backend.socket.on('synced', function(method, resp) {
                    var event = backend.options.event;

                    collection.trigger(event, method, resp);
                    collection.trigger(event + ':' + method, resp);
                });

                ready.resolve();
            });
        });

        return backend;
    };

    function Promise(context) {
        this.context = context || this;
        this.callbacks = [];
        this.resolved = undefined;
    };

    Promise.prototype.then = function(callback) {
        if (this.resolved !== undefined) {
            callback.apply(this.context, this.resolved);
        } else {
            this.callbacks.push(callback);
        }
    };

    Promise.prototype.resolve = function() {
        if (this.resolved) throw new Error('Promise already resolved');

        var self = this;
        this.resolved = arguments;

        _.each(this.callbacks, function(callback) {
            callback.apply(self.context, self.resolved);
        });
    };

})();
