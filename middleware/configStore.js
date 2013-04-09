module.exports = function() {
    var conf = require('config');
    var self = this;

    return function(req, res, next) {
        var crud = {
            create: function() {
                //Assing configuration from models config property to config module
                conf._extendDeep(conf, req.model.config);
                res.end(req.model);
            },

            read: function() {
                // Assing configuration from config module to models config property
                req.model.config = conf;
                res.end(req.model);
            },

            update: function() {
                console.log("---------------------");
                console.log(JSON.stringify(req.model.config));
                console.log("---------------------");

                // Assign req.model.config to conf
                conf._extendDeep(conf, req.model.config);
                res.end(req.model)
            },

            delete: function() {
                req.model.config = {};
                conf = {};
                res.end(req.model);
            }
        };


        if (!crud[req.method]) return next(new Error('Unsuppored method ' + req.method));
        crud[req.method]();
    }
};
