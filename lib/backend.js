var _ = require('underscore');

module.exports = function() {
    var models = {};
    
    this.create = function(model) {
        model.id = _.uniqueId('s');
        models[model.id] = model;
        return model;
    };
    
    this.read = function(model) {
        if (model.id) {
            return models[model.id];
        } else {
            return _.values(models);
        }
    };
    
    this.update = function(model) {
        models[model.id] = model;
        return model;
    };
    
    this.delete = function(model) {
        delete models[model.id];
        return model;
    };
};