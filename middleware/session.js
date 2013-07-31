var signature = require('cookie-signature');

module.exports = function(options) {
    options || (options = {});
    options.key || (options.key = 'connect.sid');
    
    if (!options.store) throw new Error('No session store provided');
    
    return function(req, res, next) {
        req.sessionID = req.cookies[options.key];

        if (req.sessionID.indexOf('s:') === 0) {
            req.sessionID = req.sessionID.slice(2);
        }

        if (options.secret) {
            req.sessionID = signature.unsign(req.sessionID, options.secret);
        }
        
        if (req.sessionID) {
            console.log(options.store);
            console.log(req.sessionID);
            
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