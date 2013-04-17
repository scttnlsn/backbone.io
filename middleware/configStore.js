module.exports = function() {
    var conf = require('config');
    var self = this;

    return function(req, res, next) {
        var crud = {
            create: function() {
                //Assing configuration from models to node-config module
                conf._extendDeep(conf, req.model);
                res.end(req.model);
            },
            
            read: function() {
                // Assing configuration from node-config module to models
                req.model = conf;
                res.end(req.model);
            },
            
            update: function() {
                // Assign req.model to node-config
                conf._extendDeep(conf, req.model);
                res.end(req.model)
            },
            
            delete: function() {
                conf.resetRuntime(function (err, written, buffer) {
                    if(err) {
                        return res.end({'error':'An error has occurred on delete' + err});
                    }
                    req.model = conf;
                    res.end(req.model);
                });
            }
        };
 

        if (!crud[req.method]) return next(new Error('Unsuppored method ' + req.method));
        crud[req.method]();
    }
};
