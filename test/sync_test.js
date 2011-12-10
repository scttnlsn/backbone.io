var assert = require('assert');
var sinon = require('sinon');
var vows = require('vows');
var Sync = require('../lib/sync');

exports.suite = vows.describe('Sync').addBatch({
    'A sync object': {
        topic: function() {
            return new Sync('backend', 'socket');
        },
        
        'when handling a request': {
            topic: function(sync) {
                var handle = sinon.spy();
                var backend = { handle: handle };
                var req = { foo: 'bar' };
                
                sync.handle(backend, req, function() {});
                return handle;
            },
            
            'delegates to the backend': function(handle) {
                assert.isTrue(handle.calledOnce);
            },
            
            'includes backend and socket in the request': function(handle) {
                var call = handle.getCall(0);
                var req = call.args[0];
                
                assert.equal(req.backend, 'backend');
                assert.equal(req.socket, 'socket');
                assert.equal(req.foo, 'bar');
            }
        },
        
        'when handling a successful request': {
            topic: function(sync) {
                var backend = {
                    handle: function(req, res, callback) {
                        res.end('foo');
                        
                        // Should be ignored
                        res.end('bar');
                        res.error('baz');
                    }
                }
                sync.handle(backend, {}, this.callback);
            },
            
            'returns the result': function(err, result) {
                assert.isNull(err);
                assert.equal(result, 'foo');
            }
        },
        
        'when handling an errored request': {
            topic: function(sync) {
                var backend = {
                    handle: function(req, res, callback) {
                        res.error(new Error('foo'));
                        
                        // Should be ignored
                        res.end('bar');
                        res.error('baz');
                    }
                }
                sync.handle(backend, {}, this.callback);
            },
            
            'creates an error result': function(err, result) {
                assert.equal(err.error, 'Error');
                assert.equal(err.message, 'foo');
            }
        }
    }
});