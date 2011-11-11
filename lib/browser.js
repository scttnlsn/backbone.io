(function() {
    var socket = io.connect();
    var origSync = Backbone.sync;
    
    Backbone.sync = function(method, model, options) {
        var backend = model.backend || model.collection.backend;
        
        if (backend) {
            // Use Socket.IO backend
            socket.of(backend).emit('sync', method, model.toJSON(), function(resp) {
                if (resp) {
                    options.success(resp);
                } else {
                    options.error('Record not found');
                }
            });
        } else {
            // Call the original Backbone.sync
            origSync(method, model, options);
        }
    };
    
    var Helpers = {
        // Listen for backend notifications and update the
        // collection models accordingly.
        bindBackend: function() {
            var self = this;
        
            this.bind('backend:create', function(model) {
                self.add(model);
            });
            this.bind('backend:update', function(model) {
                self.get(model.id).set(model);
            });
            this.bind('backend:delete', function(model) {
                self.remote(model);
            });
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
    
    Backbone.Collection = (function(Parent) {
        // Override the parent constructor
        var Child = function() {
            Parent.apply(this, arguments);
            
            if (this.backend) {
                var trigger = this.trigger.bind(this);
                
                socket.of(this.backend).on('synced', function(event, method, resp) {
                    trigger(event, method, resp);
                    trigger(event + ':' + method, resp);
                });
            }
        };
        
        // Inherit everything else from the parent
        return inherit(Parent, Child, [Helpers]);
    })(Backbone.Collection);

})();