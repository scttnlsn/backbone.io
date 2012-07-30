module.exports = function(options) {
    options || (options = {});
    options.key || (options.key = 'connect.sid');
    
    if (!options.store) throw new Error('No session store provided');
    
    return function(req, res, next) {
        req.sessionID = req.cookies[options.key];
        
        if (req.sessionID) {
            options.store.load(req.sessionID, function(err, session) {
                if (err) return next(err);
                if (!session) return next(new Error('Session not found'));
                req.session = session;
                next();
            });
        } else {
            next();
        }
    };
};