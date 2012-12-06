module.exports = Promise;

function Promise(context) {
    this.context = context || this;
    this.callbacks = [];
    this.resolved = undefined;
};

Promise.prototype.then = function(callback) {
    if (this.resolved) {
        callback.apply(this.context, this.resolved);
    } else {
        this.callbacks.push(callback);
    }
};

Promise.prototype.resolve = function() {
    if (this.resolved) throw new Error('Promise already resolved');

    var callback;
    this.resolved = arguments;

    while (callback = this.callbacks.shift()) {
        callback.apply(this.context, this.resolved);
    }
};
