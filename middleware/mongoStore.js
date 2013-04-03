module.exports = function(db, colname, options) {
    var mongo = require('mongoskin');

    var self = this;
    if (typeof db == "string") {
        var db = mongo.db('localhost:27017/' + db + '?auto_reconnect', {safe:true});
    } else if (! db instanceof mongo.Db) {
        console.error ("db must be a mongo.Db or a string.");
        return new Error("wrong db object");
    }

    // cache up all this, it's just syntactical
    var collection = db.collection(colname);

    var query_id = function(id) {
        try {
            return {$in: [id, mongo.ObjectID(id)]};
        }
        catch (e) {
            return id;
        }
    };

    var ret = function(req, res, next) {
        var callback = function(err, result) {
            if (err) return next(err);
            res.end(result);
        };

        var crud = {
            create: function() {
                var item = req.model;
                collection.insert(item, {safe:true}, function(err, result) {
                    if (err) {
                        res.end({'error':'An error has occurred on create ' + err});
                    } else {
                        res.end(result[0]);
                    }
                });
            },

            read: function() {
                console.log ('READ', req);
                if (req.model._id) {
                    var id = query_id(req.model._id);
                    collection.findOne({'_id': id}, function(err, item) {
                        if (err) {
                            res.end({'error':'An error has occurred on read ' + err});
                        } else {
                            res.end(item);
                        }
                    });
                } else {
                    collection.find().toArray(function(err, items) {
                        if (err) {
                            res.end({'error':'An error has occurred on read ' + err});
                        } else {
                            res.end(items);
                        }
                    });
                }
            },

            update: function() {
                var item = {};
                for (var key in req.model) {
                    item[key] = req.model[key];
                }
                delete item._id;

                var id = query_id(req.model._id);

                collection.update({'_id': id}, item, {safe:true}, function(err, result) {
                    item['_id'] = req.model._id;
                    if (err) {
                        res.end({'error':'An error has occurred on update ' + err});
                    } else {
                        res.end(item);
                    }
                });
            },

            delete: function() {
                var id = query_id(req.model._id);
                collection.remove({'_id': id}, {safe:true}, function(err, result) {
                    if (err) {
                        res.end({'error':'An error has occurred on delete' + err});
                    } else {
                        res.end(req.model);
                    }
                });
            }
        };

        if (!crud[req.method]) return next(new Error('Unsuppored method ' + req.method));
        crud[req.method]();
    };

    ret.options = options;
    ret.collection = collection;
    ret.db = db;
    ret.colname = colname;
    return ret;
};
