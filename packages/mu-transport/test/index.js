'use strict'

var test = require('tap').test
var createMu = require('mu')
var transport = require('../')
var createLogger = () => Object.assign({}, require('abstract-logging'), {child: function () { return this }})

test('driver send error', function (t) {
  var logger = createLogger()
  var mu = createMu({logger: logger})
  var testErr = Error('test')

  transport(createDriver, mu, {})

  function createDriver (drv, receive) {
    process.nextTick(() => {
      logger.error = function (o) {
        if (!o.err) return
        t.is(o.err, testErr)
        t.ok(o.out)
        t.end()
      }
      receive(null, {protocol: {trace: [], path: []}, pattern: {test: 'test'}})
    })
    return {
      send: (p, cb) => cb(testErr)
    }
  }
})
