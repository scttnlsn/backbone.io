0.4.0 / 2013-07-31
==================

* Updated to work with Express 3
* Fixed Backbone.sync to handle undefined options
* Fixed cookie/session middleware

0.3.3 / 2013-01-18
==================

* Added IE compatibility
* Added Backbone 0.9.10 compatibility

0.3.2 / 2012-10-24
==================

* Fixed middleware error handling bug
* Changed session middleware to use `load` instead of `get`
* Fixed sync override to return original jqXHR object

0.3.1 / 2012-07-29
==================

* Fixed bindBackend undefined error

0.3.0 / 2012-07-29
==================

* Added all error properties to sync response
* Changed client to require explicit `connect` call
* Fixed deletion of success/error callbacks during normal `sync`

0.2.7 / 2012-04-09
==================

* Fixed removal of backend event listeners

0.2.6 / 2012-04-09
==================

* Fixed memory leak in backend event emitters

0.2.5 / 2012-03-22
==================

* Added channel support to backends

0.2.4 / 2012-02-22
==================

* Fixed problem with success/error callbacks being deleted from save options

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