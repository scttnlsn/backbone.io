module.exports = function(Model) {
    return function(req, res, next) {
        var callback = function(err, result) {
            if (err) return next(err);
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
                var model = {};
                for (var key in req.model) {
                    model[key] = req.model[key];
                }
                delete model._id;
                
                Model.update({ _id: req.model._id }, { '$set': model }, function(err) {
                    if (err) return next(err);
                    res.end(req.model);
                });
            },
            
            delete: function() {
                Model.remove({ _id: req.model._id }, function(err) {
                    if (err) return next(err);
                    res.end(req.model);
                });
            }
        };
        
        if (!crud[req.method]) return next(new Error('Unsuppored method ' + req.method));
        crud[req.method]();
    }
};