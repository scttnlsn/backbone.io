module.exports = function(Model) {
    return function(req, res, next) {
        var convertItem = function(item) {
            item = item.toObject();

            item.id = item._id;

            delete item._id;
            delete item.__v;

            return item;
        };

        var callback = function(err, result) {
            if (err) return next(err);

            if(result instanceof Array)
                res.end(result.map(convertItem));
            else
                res.end(convertItem(result))
        };

        var crud = {
            create: function() {
                Model.create(req.model, callback);
            },

            read: function() {
                if (req.model.id) {
                    Model.findById(req.model.id, callback);
                } else {
                    Model.find(callback);
                }
            },

            update: function() {
                var model = convertItem(req.model);

                Model.update({ _id: req.model.id }, { '$set': model }, function(err) {
                    if (err) return next(err);
                    res.end(req.model);
                });
            },

            delete: function() {
                Model.remove({ _id: req.model.id }, function(err) {
                    if (err) return next(err);
                    res.end(req.model);
                });
            }
        };

        if (!crud[req.method]) return next(new Error('Unsuppored method ' + req.method));
        crud[req.method]();
    }
};
