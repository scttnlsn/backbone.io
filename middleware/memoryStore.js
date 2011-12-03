var _ = require('underscore');

module.exports = function() {
    var models = {};
    
    return function(req, res, next) {
        var crud = {
            create: function() {
                var model = req.model;
                model.id = _.uniqueId('s');
                models[model.id] = model;
                res.end(model);
            },
            
            read: function() {
                if (req.model.id) {
                    res.end(models[req.model.id]);
                } else {
                    res.end(_.values(models));
                }
            },
            
            update: function() {
                models[req.model.id] = req.model;
                res.end(req.model);
            },
            
            delete: function() {
                delete models[req.model.id];
                res.end(req.model);
            }
        };
        
        if (!crud[req.method]) return next(new Error('Unsuppored method ' + req.method));
        crud[req.method]();
    }
};