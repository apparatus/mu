'use strict'

var test = require('tap').test
var logger = require('abstract-logging')
var mue = require('mu-error')()
var router = require('../')

var MALFORMED_PACKET = 'Malformed packet no pattern or response field. Message will be discarded'
var NO_MATCHING_ROUTE = 'Routing error: no matching route and no default route provided, Message will be discarded'

test('malformed packet', function (t) {
  var api = router({logger: logger, mue: mue})

  api.route({}, function (err) {
    t.ok(err instanceof Error)
    t.is(err.isBoom, true)
    t.is(err.isMu, true)
    err = mue.extract(err)
    t.is(err.code, mue.ERRORS.TRANSPORT)
    t.is(err.message, MALFORMED_PACKET)
    t.end()
  })
})

test('no matching route', function (t) {
  var api = router({logger: logger, mue: mue})

  api.route({response: {}, protocol: {path: ['test']}}, function (err) {
    t.ok(err instanceof Error)
    t.is(err.isBoom, true)
    t.is(err.isMu, true)
    err = mue.extract(err)
    t.is(err.code, mue.ERRORS.FRAMEWORK)
    t.is(err.message, NO_MATCHING_ROUTE)
    t.end()
  })
})
