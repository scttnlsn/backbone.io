module.exports = function() {
    var models = {};
    var id = 1;
    
    return function(req, res, next) {
        var crud = {
            create: function() {
                var model = req.model;
                model.id = id++;
                models[model.id] = model;
                res.end(model);
            },
            
            read: function() {
                if (req.model.id) {
                    res.end(models[req.model.id]);
                } else {
                    var values = [];
                    for (var id in models) {
                        values.push(models[id])
                    }
                    res.end(values);
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