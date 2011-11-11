Backbone.IO
===========

Storage-agnostic Backbone.js sync override and server notifications via Socket.IO.

Install
-------
    npm install backbone.io
    
Usage
-----

On the server:

    var http        = require('http'),
        backboneio  = require('backbone.io'),
        app         = http.createServer().listen(3000);

    backboneio.listen(app, { mybackend: new backboneio.Backend() });

On the client:

    <!-- Include jQuery, Underscore, Backbone -->
    
    <script src="/socket.io/socket.io.js"></script>
    <script src="/socket.io/backbone.io.js"></script>
    
    <script>
        var MyCollection = Backbone.Collection.extend({
            backend: 'mybackend'
        });
    </script>
    
Models in `TestCollection` will now be synced to `mybackend`.

Events
------

When a model is synced with a particular backend, the backend will trigger events
on collections (across multiple clients) that share the backend.  For example, we
could keep collections synced in realtime with the following event bindings:

    var MyCollection = Backbone.Collection.extend({
        
        backend: 'mybackend',
        
        initialize: function() {
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
        
    });
    
Or use the provided shortcut:
    
    ...
    
    initialize: function() {
        this.bindBackend();
    }