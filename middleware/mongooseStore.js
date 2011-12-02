var _ = require('underscore');

module.exports = function(Model) {
    return function(req, res) {
        var callback = function(err, result) {
            if (err) throw err;
            res.end(result);
        };
        
        var crud = {
            create: function() {
                Model.create(req.model, callback);
            },
            
            read: function() {
                if (req.model._id) {
                    Model.findById(req.model._id, callback);
                } else {
                    Model.find(callback);
                }
            },
            
            update: function() {
                var model = _.clone(req.model);
                delete model._id;
                
                Model.update({ _id: req.model._id }, { '$set': model }, function(err) {
                    if (err) throw err;
                    res.end(req.model);
                });
            },
            
            delete: function() {
                Model.remove({ _id: req.model._id }, function(err) {
                    if (err) throw err;
                    res.end(req.model);
                });
            }
        };
        
        crud[req.method]();
    }
};