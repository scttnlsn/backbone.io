module.exports = function(options) {
    options || (options = {});
    options.key || (options.key = 'connect.sid');
    
    if (!options.store) throw new Error('No session store provided');
    
    return function(req, res, next) {
        req.sessionID = req.cookies[options.key];
        
        if (req.sessionID) {
            options.store.get(req.sessionID, function(err, session) {
                if (err) return next(err);
                req.session = session;
                next();
            });
        } else {
            next();
        }
    };
};