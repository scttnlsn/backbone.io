module.exports = function(dbname, colname) {
    var mongo = require('mongodb');

    var Server = mongo.Server,
    Db = mongo.Db;

    var server = new Server('localhost', 27017, {auto_reconnect: true});
    db = new Db(dbname, server, {safe: true});

    db.open(function(err, db) {
        if(!err) {
            console.log("Connected to '" + dbname + "' database for (" + colname + ").");
            db.collection(colname, {safe:true}, function(err, collection) {
                if (err) {
                    console.log("The '" + colname + "' collection doesn't exist.");
                }
            });
        }
    });

    return function(req, res, next) {
        var callback = function(err, result) {
            if (err) return next(err);
            res.end(result);
        };

        var crud = {
            create: function() {
                var item = req.model;
                console.log('Adding ' + dbname + ':' + colname + ' item: ' + JSON.stringify(item));
                db.collection(colname, function(err, collection) {
                    collection.insert(item, {safe:true}, function(err, result) {
                        if (err) {
                            res.end({'error':'An error has occurred'});
                        } else {
                            console.log('Success: ' + JSON.stringify(result[0]));
                            res.end(result[0]);
                        }
                    });
                });
            },

            read: function() {
                if (req.model._id) {
                    var id = req.model._id;
                    console.log('Retrieving ' + dbname + ':' + colname + ' item: ' + id);
                    db.collection(colname, function(err, collection) {
                        collection.findOne({'_id': id}, function(err, item) {
                            res.end(item);
                        });
                    });
                } else {
                    db.collection(colname, function(err, collection) {
                        collection.find().toArray(function(err, items) {
                            res.end(items);
                        });
                    });
                }
            },

            update: function() {
                var item = {};
                for (var key in req.model) {
                    item[key] = req.model[key];
                }
                delete item._id;

                var id = req.model._id;

                console.log('Updating ' + dbname + ':' + colname + ' item: ' + id);
                console.log(JSON.stringify(item));
                db.collection(colname, function(err, collection) {
                    collection.update({'_id': id}, item, {safe:true}, function(err, result) {
                        if (err) {
                            console.log('Error updating ' + dbname + ':' + colname + ' item: ' + err);
                            res.end({'error':'An error has occurred'});
                        } else {
                            console.log('' + result + ' document(s) updated');
                            res.end(item);
                        }
                    });
                });
            },

            delete: function() {
                var id = req.model._id;
                console.log('Deleting ' + dbname + ':' + colname + ' item: ' + id);
                db.collection(colname, function(err, collection) {
                    collection.remove({'_id': id}, {safe:true}, function(err, result) {
                        if (err) {
                            res.end({'error':'An error has occurred - ' + err});
                        } else {
                            console.log('' + result + ' document(s) deleted');
                            res.end(req.model);
                        }
                    });
                });
            }
        };

        if (!crud[req.method]) return next(new Error('Unsuppored method ' + req.method));
        crud[req.method]();
    }
};
