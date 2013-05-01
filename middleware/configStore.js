module.exports = function() {
    var _ = require('underscore');
    var conf = require('mbc-common').config;
    var self = this;

    return function(req, res, next) {
        var crud = {
            create: function() {
                //Assing configuration from models to node-config module
                conf._extendDeep(conf, req.model);
                res.end(req.model);
            },

            read: function() {
                // Assing configuration and defaults from node-config module to models
                req.model[0] = _.extend(conf, {type: 'config'} );
                req.model[1] = _.extend(conf.getOriginalConfig(), { type: 'defaults'} );
                res.end(req.model);
            },

            update: function() {
                // Assign req.model to node-config
                conf._extendDeep(conf, req.model[0]);
                res.end(req.model)
            },

            delete: function() {
                conf.resetRuntime(function (err, written, buffer) {
                    if(err) {
                        return res.end({'error':'An error has occurred on delete' + err});
                    }
                    req.model[0] = conf;
                    res.end(req.model);
                });
            }
        };


        if (!crud[req.method]) return next(new Error('Unsuppored method ' + req.method));
        crud[req.method]();
    }
};
