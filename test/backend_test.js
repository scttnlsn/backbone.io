var assert = require('assert');
var sinon = require('sinon');
var Backend = require('../lib/backend');

describe('Backend', function() {
    var backend;
    
    beforeEach(function() {
        backend = new Backend();
    });
    
    describe('#use', function() {
        it('applies middleware to all contexts by default', function() {
            var middleware = sinon.spy();
            
            backend.use(middleware);
            backend.handle({ method: 'foo' }, {});
            
            assert.ok(middleware.calledOnce);
        });
        
        it('only calls middleware used for a given context', function() {
            var middleware = sinon.spy();
            
            backend.use('bar', middleware);
            backend.use(sinon.spy());
            backend.handle({ method: 'foo' }, {});
            
            assert.equal(middleware.callCount, 0);
        });
        
        it('accepts multiple contexts', function() {
            var middleware = sinon.spy();
            
            backend.use('bar', 'baz', middleware);
            backend.use(sinon.spy());
            backend.handle({ method: 'foo' }, {});
            backend.handle({ method: 'bar' }, {});
            backend.handle({ method: 'baz' }, {});
            
            assert.ok(middleware.calledTwice);
        });
        
        it('chains middleware in the order used', function() {
            var first = sinon.spy();
            var second = sinon.spy();
            var third = sinon.spy();
            var fourth = sinon.spy();
            
            backend.use(function(req, res, next) {
                first();
                next();
            });
            backend.use(function(req, res, next) {
                second();
                next();
            });
            backend.use(function(req, res, next) {
                third();
            });
            backend.use(function(req, res, next) {
                fourth();
            });
            backend.handle({ method: 'foo' }, {});
            
            assert.ok(first.calledOnce);
            assert.ok(first.calledBefore(second));
            assert.ok(second.calledOnce);
            assert.ok(second.calledBefore(third));
            assert.ok(third.calledOnce);
            assert.ok(third.calledBefore(fourth));
            assert.ok(!fourth.called);
        });
    });
    
    describe('#handle', function() {
        it('returns the requested model by default', function() {
            var end = sinon.spy();
            
            backend.handle({ method: 'foo', model: 'bar' }, { end: end });
            
            var result = end.getCall(0).args[0];
            
            assert.ok(end.calledOnce);
            assert.equal(result, 'bar');
        });
        
        it('passes `req`, `res` and `next` to middleware', function() {
            var middleware = sinon.spy();
            
            backend.use(middleware);
            backend.handle({ method: 'foo' }, { bar: 'baz' });
            
            var args = middleware.getCall(0).args;
            
            assert.ok(middleware.calledOnce);
            assert.equal(args[0].method, 'foo');
            assert.equal(args[1].bar, 'baz');
            assert.equal(typeof args[2], 'function');
        });
        
        it('passes uncaught errors to callback', function() {
            var callback = sinon.spy();
            
            backend.use(function(req, res, next) {
                throw new Error('bar');
            });
            backend.handle({ method: 'foo' }, {}, callback);
            
            var err = callback.getCall(0).args[0];
            
            assert.ok(callback.calledOnce);
            assert.equal(err.message, 'bar');
        });
        
        it('passes uncaught errors to accepting middleware', function() {
            var spy = sinon.spy();
            
            backend.use(function(req, res, next) {
                throw new Error('bar');
            });
            backend.use(function(err, req, res, next) {
                spy(err);
            });
            backend.handle({ method: 'foo' }, {});
            
            var err = spy.getCall(0).args[0];
            
            assert.ok(spy.calledOnce);
            assert.equal(err.message, 'bar');
        });
    });
});