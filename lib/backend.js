var _ = require('underscore');

module.exports = function() {
    var models = {};
    
    this.create = function(model, callback) {
        model.id = _.uniqueId('s');
        models[model.id] = model;
        callback(null, model);
    };
    
    this.read = function(model, callback) {
        if (model.id) {
            var found = models[model.id];
            if (found) {
                callback(null, found);
            } else {
                callback('Record not found');
            }
        } else {
            return callback(null, _.values(models));
        }
    };
    
    this.update = function(model, callback) {
        models[model.id] = model;
        callback(null, model);
    };
    
    this.delete = function(model, callback) {
        delete models[model.id];
        callback(null, model);
    };
};