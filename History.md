0.2.3 / 2012-01-23
==================

* Fixed `Backbone.sync` for models with no collection or backend

0.2.2 / 2011-12-07
==================

* Fixed backend binding to only update models that are present in a collection

0.2.1 / 2011-12-07
==================

* Added support for explicit backend notifications
* Added `options` object to request
* Removed client notification of `read` requests

0.2.0 / 2011-12-03
==================

* Added cookie and session middleware
* Changed backend architecture to use middleware approach
* Changed memory and Mongoose backends to use middleware API
* Removed Underscore dependency

0.1.3 / 2011-11-23
==================

* Fixed `backend:delete` handling in backend event binding

0.1.2 / 2011-11-16
==================

* Added support for multiple included backends
* Added Mongoose backend

0.1.1 / 2011-11-16
==================

* Change backend event binding to use `idAttribute`

0.1.0 / 2011-11-11
==================

* Initial release