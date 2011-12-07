Backbone.IO
===========

Backend-agnostic Backbone.js sync override and server notifications via Socket.IO.

Install
-------

    npm install backbone.io
    
Usage
-----

On the server:

    var http = require('http');
    var backboneio = require('backbone.io');
    
    var app = http.createServer();    
    app.listen(3000);

    var backend = backboneio.createBackend();
    backend.use(backboneio.middleware.memoryStore());
    
    backboneio.listen(app, { mybackend: backend });

On the client:

    <!-- Include Underscore, Backbone -->
    
    <script src="/socket.io/socket.io.js"></script>
    <script src="/socket.io/backbone.io.js"></script>
    
    <script>
        var MyCollection = Backbone.Collection.extend({
            backend: 'mybackend'
        });
    </script>
    
Models in `MyCollection` will now be synced to `mybackend`.

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
                self.remove(model.id);
            });
        }
        
    });
    
Or use the provided shortcut:
    
    backend: 'mybackend',
    
    initialize: function() {
        this.bindBackend();
    }
    
In addition to `backend:create`, `backend:read`, `backend:update`, and `backend:delete`
events, a generic `backend` event is also triggered when a model is synced.

    this.bind('backend', function(method, model) {
        // Method will be one of create, read, update, or delete
    });
    
The event prefix `backend` is used by default but this can be customized by setting the
event name on the server.

    backboneio.listen(app, { mybackend: backend }, { event: 'myevent' });

Backends and Middleware
-----------------------

Backends are stacks of composable middleware (inspired by Connect) that are responsible
for handling sync requests and responding appropriately.  Each middleware is a function
that accepts request and response objects (and optionally a function that can be called
to continue down the stack).  A middleware will generally either return a result by
calling `end` on the response object or pass control downward.  For example, let's add a
logger middleware to our backend:

    var backend = backboneio.createBackend();
    
    backend.use(function(req, res, next) {
        console.log(req.backend);
        console.log(req.method);
        console.log(JSON.stringify(req.model));
        next();
    });
    
    backend.use(backboneio.middleware.memoryStore());
    
Middleware can also be applied to only particular types of requests by passing the desired
contexts to `use`:

    backend.use('create', 'update', 'delete', function(req, res, next) {
        if (isAuthorized(req)) {
            next();
        } else {
            next(new Error('Unauthorized'));
        }
    });
    
Or alternatively by using one of the four helper methods (`create`, `read`, `update`, `delete`):

    backend.read(function(req, res) {
        if (req.model.id) {
            req.end(mymodels[req.model.id]);
        } else {
            req.end(mymodels);
        }
    });
    
If the bottom of the middleware stack is reached before a result is returned then the requested
model is returned by default: `res.end(req.model)`.  Look in the `middleware` directory for more
examples.
    
Customizing
-----------

In addition to middleware, the behavior of Backbone.IO can be customized via standard Socket.IO
mechanisms.  The object returned from the call to `listen` is the Socket.IO object and can be
manipulated further.  See http://socket.io for more details.