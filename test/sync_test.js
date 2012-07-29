var assert = require('assert');
var sinon = require('sinon');
var Sync = require('../lib/sync');

describe('Sync', function() {
    var backend, callback, handle, sync;
    
    describe('#handle', function() {
        beforeEach(function() {
            backend = {
                handle: function(req, res) {
                    if (req.error) {
                        res.error(new Error('bar'));
                    } else {
                        res.end('foo');
                    }
                    
                    // Should be ignored
                    res.end('baz');
                    res.error('qux');
                }
            };
            callback = sinon.spy();
            handle = sinon.spy(backend, 'handle');
            sync = new Sync('backend', 'socket');
        });
        
        it('should delegate to the backend', function() {
            sync.handle(backend, {}, callback);
            
            assert.ok(handle.calledOnce);
        });
        
        it('should merge `backend` and `socket` into the request object', function() {
            sync.handle(backend, { foo: 'bar' }, callback);
            
            var req = handle.getCall(0).args[0];
            
            assert.equal(req.backend, 'backend');
            assert.equal(req.socket, 'socket');
            assert.equal(req.foo, 'bar');
        });
        
        it('should pass result to callback', function() {
            sync.handle(backend, {}, callback);
            
            var call = callback.getCall(0);
            var err = call.args[0];
            var result = call.args[1];
            
            assert.ok(callback.called);
            assert.equal(err, null);
            assert.equal(result, 'foo');
        });
        
        it('should pass error to callback', function() {
            sync.handle(backend, { error: true }, callback);
            
            var call = callback.getCall(0);
            var err = call.args[0];
            var result = call.args[1];
            
            assert.ok(callback.called);
            assert.ok(err);
            assert.ok(err.error);
            assert.equal(err.error.name, 'Error');
            assert.equal(err.error.message, 'bar');
            assert.equal(result, undefined);
        });
    });
});