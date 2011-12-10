var assert = require('assert');
var sinon = require('sinon');
var vows = require('vows');
var Backend = require('../lib/backend');

exports.suite = vows.describe('Backend').addBatch({
    'A backend without middleware': {
        topic: function() {
            return new Backend();
        },
        
        'when handling a request': {
            topic: function(backend) {
                var end = sinon.spy();
                backend.handle({ method: 'foo', model: 'bar' }, { end: end });
                return end;
            },
            
            'results in the requested model': function(end) {
                assert.isTrue(end.calledOnce);
                
                var call = end.getCall(0);
                var args = end.args[0];
                
                assert.equal(args[0], 'bar');
            }
        }
        
    },
    
    'A backend with middleware': {
        topic: function() {
            var backend = new Backend();
            backend.use('foo', sinon.spy());
            backend.use('bar', sinon.spy());
            backend.use(sinon.spy());
            return backend;
        },
        
        'sets the contexts on the middleware layer': function(backend) {
            assert.include(backend.stack[0].context, 'foo');
            assert.include(backend.stack[1].context, 'bar');
        },
        
        'uses all contexts when not specified': function(backend) {
            assert.include(backend.stack[2].context, 'all');
        },
        
        'when handling a request': {
            topic: function(backend) {
                backend.handle({ method: 'foo' }, {});
                return backend
            },
            
            'calls only the applicable layers': function(backend) {
                assert.isTrue(backend.stack[0].middleware.calledOnce);
                assert.isFalse(backend.stack[1].middleware.called);
            }
        }
    },
    
    'A backend with multiple middleware layers': {
        topic: function() {
            var backend = new Backend();
            backend.use(function(req, res, next) {
                next();
            });
            backend.use(function(req, res, next) {
                next();
            });
            backend.use(sinon.spy());
            return backend;
        },
        
        'when handling a request': {
            topic: function(backend) {
                backend.handle({ method: 'foo' }, {});
                return backend
            },
            
            'passes control down the stack': function(backend) {
                assert.isTrue(backend.stack[2].middleware.calledOnce);
            }
        }
    },
    
    'A backend that throws an error': {
        topic: function() {
            var backend = new Backend();
            backend.use(function(req, res, next) {
                throw new Error('foo');
            });
            return backend;
        },
        
        'when handling a request': {
            topic: function(backend) {
                backend.handle({ method: 'bar' }, {}, this.callback);
            },
            
            'passes err to callback': function(err, result) {
                assert.isNotNull(err);
            }
        }
    },
    
    'A backend that passes an error': {
        topic: function() {
            var backend = new Backend();
            backend.use(function(req, res, next) {
                next(new Error('foo'));
            });
            return backend;
        },
        
        'when handling a request': {
            topic: function(backend) {
                backend.handle({ method: 'bar' }, {}, this.callback);
            },
            
            'results in an error': function(err, result) {
                assert.isNotNull(err);
                assert.equal(err.message, 'foo');
            }
        }
    },
    
    'A backend that accepts an error': {
        topic: function() {
            var backend = new Backend();
            backend.use(function(req, res, next) {
                next(new Error('foo'));
            });
            backend.use(function(err, req, res, next) {
                res.end(err.message);
            });
            return backend;
        },
        
        'when handling a request': {
            topic: function(backend) {
                var end = sinon.spy();
                backend.handle({ method: 'bar' }, { end: end });
                return end;
            },
            
            'does not result in an error': function(end) {
                assert.isTrue(end.calledOnce);
                
                var call = end.getCall(0);
                var args = end.args[0];
                
                assert.equal(args[0], 'foo');
            }
        }
    }
});