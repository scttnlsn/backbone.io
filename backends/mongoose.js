module.exports = function(Model, options) {
    options || (options = {})
    options.idAttribute || (options.idAttribute = '_id')

    var idQuery = function(model) {
        var query = {};
        query[options.idAttribute] = model[options.idAttribute];
        return query;
    };

    this.create = function(model, callback) {
        Model.create(model, function(err, doc) {
            if (err) {
                callback(err);
            } else {
                callback(null, doc);
            }
        });
    };

    this.read = function(model, callback) {
        if (model[options.idAttribute]) {
            Model.findById(model[options.idAttribute], callback);
        } else {
            Model.find(callback);
        }
    };

    this.update = function(model, callback) {
        var query = idQuery(model);
        var id = model[options.idAttribute];
        delete model[options.idAttribute];

        Model.update(query, { '$set': model }, function(err) {
            if (err) {
                callback(err);
            } else {
                model[options.idAttribute] = id;
                callback(null, model);
            }
        });
    };

    this.delete = function(model, callback) {
        var query = idQuery(model);
        
        Model.remove(query, function(err) {
            if (err) {
                callback(err);
            } else {
                callback(null, model);
            }
        });
    };
};