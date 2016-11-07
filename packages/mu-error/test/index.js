var path = require('path')
var test = require('tape')
var mue = require('../')
var MU_CODES = mue.MU_CODES
var ERRORS = mue.ERRORS
var ctrl = {
  cache: require.cache || arguments[5],
  mue: require.resolve ? require.resolve('..') : path.resolve(arguments[6][0], '..', 'index.js')
}

// must be first test
test('patches Error.captureStackTrack for cross browser support', function (t) {
  delete ctrl.cache[ctrl.mue]
  var captureStackTrace = Error.captureStackTrace
  delete Error.captureStackTrace
  require('../')
  t.ok(Error.captureStackTrace)
  t.is(fnName(Error.captureStackTrace), 'noop')
  Error.captureStackTrace()
  if (captureStackTrace) Error.captureStackTrace = captureStackTrace
  t.end()
})

test('returns a valid boom object', function (t) {
  var muErr = mue()
  var err = muErr(400, 'test', {test: 'data'})
  t.ok(err instanceof Error)
  t.is(err.isBoom, true)
  t.is(err.output.statusCode, 400)
  t.deepEqual(err.data, {test: 'data'})
  t.is(err.output.payload.message, 'test')
  t.end()
})

test('throws if statusCode is not 1..99 or 400+', function (t) {
  var muErr = mue()
  t.throws(function () { muErr(300) })
  t.end()
})

test('converts code < 100 to 500 status code', function (t) {
  var muErr = mue()
  var err = muErr(ERRORS.SERVICE)
  t.is(err.output.statusCode, 500)
  t.end()
})

test('adds isMu to when code < 100', function (t) {
  var muErr = mue()
  t.is(muErr(ERRORS.SERVICE).isMu, true)
  t.is(muErr.create(ERRORS.SERVICE).isMu, true)
  t.end()
})

test('adds mu error object when code < 100', function (t) {
  var muErr = mue()
  var err = muErr(ERRORS.SERVICE)
  t.deepEqual(
    err.output.mu,
    { code: ERRORS.SERVICE, error: MU_CODES[ERRORS.SERVICE], message: undefined }
  )
  t.end()
})

test('in dev mode, adds mu error object to payload when code < 100', function (t) {
  var muErr = mue({dev: true})
  var err = muErr(ERRORS.SERVICE)
  t.deepEqual(
    err.output.payload.mu,
    { code: ERRORS.SERVICE, error: MU_CODES[ERRORS.SERVICE], message: undefined }
  )
  t.end()
})

test('in dev mode, adds data to mu error object when data present', function (t) {
  var muErr = mue({dev: true})
  var err = muErr(1, 'test', {data: 'test'})
  t.deepEqual(
    err.output.payload.mu,
    { code: ERRORS.SERVICE, error: MU_CODES[ERRORS.SERVICE], message: 'test', data: {data: 'test'} }
  )
  t.end()
})

test('defaults to error code 1', function (t) {
  var muErr = mue()
  t.deepEqual(
    muErr().output.mu,
    { code: ERRORS.SERVICE, error: MU_CODES[ERRORS.SERVICE], message: undefined }
  )
  t.deepEqual(
    muErr('test').output.mu,
    { code: ERRORS.SERVICE, error: MU_CODES[ERRORS.SERVICE], message: 'test' }
  )
  t.end()
})

test('mue.wrap converts Error object', function (t) {
  var muErr = mue()
  var err = Error('test')
  muErr.wrap(err, 2, 509, 'test')
  t.is(err.isBoom, true)
  t.is(err.isMu, true)
  t.is(err.output.mu.code, 2)
  t.is(err.output.mu.message, 'test: test')

  var result = muErr.wrap(Error('test'))
  t.is(result.isBoom, true)
  t.is(result.isMu, true)
  t.is(result.output.mu.code, 1)
  t.is(result.output.mu.message, 'test')

  t.end()
})

test('mue.wrap wraps Boom object', function (t) {
  var muErr = mue()
  var err = muErr(400, 'test')
  muErr.wrap(err, 2, 400, 'test')
  t.is(err.isBoom, true)
  t.is(err.isMu, true)
  t.is(err.output.mu.code, 2)
  t.is(err.output.mu.message, 'test: test')

  var result = muErr.wrap(muErr(400, 'test'))
  t.is(result.isBoom, true)
  t.is(result.isMu, true)
  t.is(result.output.mu.code, 1)
  t.is(result.output.mu.message, 'test')

  result = muErr.wrap(muErr(400, 'test'))

  t.end()
})

test('mue.wrap wraps serialized-deserialized Boom object', function (t) {
  var muErr = mue()
  var err = JSON.parse(JSON.stringify(muErr(400, 'test')))
  muErr.wrap(err, 2, 400, 'test')
  t.is(err.isBoom, true)
  t.is(err.isMu, true)
  t.is(err.output.mu.code, 2)
  t.is(err.output.mu.message, 'test: test')
  t.is(err.message, 'test')
  t.ok(err.stack)

  var result = muErr.wrap(JSON.parse(JSON.stringify(muErr(400, 'test'))))
  t.is(result.isBoom, true)
  t.is(result.isMu, true)
  t.is(result.output.mu.code, 1)
  t.is(result.output.mu.message, 'test')
  t.is(result.message, 'test')
  t.ok(err.stack)

  result = muErr.wrap(JSON.parse(JSON.stringify(muErr('test'))))
  t.is(result.isBoom, true)
  t.is(result.isMu, true)
  t.is(result.output.mu.code, 1)
  t.is(result.output.mu.message, 'test')
  t.is(result.message, 'test')
  t.ok(err.stack)

  // message fallbacks
  err = JSON.parse(JSON.stringify(muErr('test')))
  err.message = ''
  result = muErr.wrap(err)
  t.is(result.output.mu.message, 'test')
  t.is(result.message, 'test')

  err = JSON.parse(JSON.stringify(muErr('test')))
  err.message = ''
  err.isMu = false
  result = muErr.wrap(err)
  t.is(result.output.mu.message, 'test')
  t.is(result.message, 'An internal server error occurred')

  // force set proto fallback:

  var setPrototypeOf = Object.setPrototypeOf
  Object.setPrototypeOf = null
  result = muErr.wrap(JSON.parse(JSON.stringify(muErr('test'))))
  t.is(result.isBoom, true)
  t.is(result.isMu, true)
  t.is(result.output.mu.code, 1)
  t.is(result.output.mu.message, 'test')
  t.is(result.message, 'test')
  Object.setPrototypeOf = setPrototypeOf

  t.end()
})

test('mue.wrap immediately returns mu error objects with the same muCode', function (t) {
  var muErr = mue({serializeErrorProps: false})
  var err = muErr(3)
  var before = JSON.stringify(err.output.mu)
  var result = muErr.wrap(err, 3)
  t.is(JSON.stringify(result.output.mu), before)

  err = muErr()
  before = JSON.stringify(err.output.mu)
  result = muErr.wrap(err)
  t.is(JSON.stringify(result.output.mu), before)
  t.end()
})

test('mue.wrap immediately returns mu error objects when input muCode is different', function (t) {
  var muErr = mue()
  var err = muErr(3)
  var before = JSON.stringify(err)
  var result = muErr.wrap(err, 3)
  t.is(before, JSON.stringify(result))

  err = muErr()
  before = JSON.stringify(err)
  result = muErr.wrap(err)
  t.is(before, JSON.stringify(result))
  t.end()
})

test('mue.wrap immediately returns errors that are null or undefined', function (t) {
  var muErr = mue()
  t.is(muErr.wrap(null), null)
  t.is(muErr.wrap(undefined), undefined)
  t.end()
})

test('mue.wrap throws if err is not instanceof Error, or null, or undefined', function (t) {
  t.throws(() => mue().wrap({err: 'oh oh'}))
  t.end()
})

test('mue.remoteWrap immediately returns errors that are null or undefined', function (t) {
  var muErr = mue()
  t.is(muErr.wrapRemote(null), null)
  t.is(muErr.wrapRemote(undefined), undefined)
  t.end()
})

test('mue.wrapRemote manages remote and local stacks', function (t) {
  var muErr = mue()
  var err = JSON.parse(JSON.stringify(muErr('test')))
  muErr.wrapRemote(err, 2, 400, 'test')
  t.is(err.isBoom, true)
  t.is(err.isMu, true)
  t.is(err.output.mu.code, 2)
  t.is(err.output.mu.message, 'test: test')
  t.is(err.message, 'test')
  t.ok(err.stack)
  t.ok(Array.isArray(err.remoteStacks))
  t.is(err.remoteStacks.length, 1)
  err = JSON.parse(JSON.stringify(err))
  muErr.wrapRemote(err, 2, 400, 'test')
  t.is(err.remoteStacks.length, 2)
  err = JSON.parse(JSON.stringify(err))
  muErr.wrapRemote(err, 3, 400, 'test')
  t.is(err.remoteStacks.length, 3)
  t.is(err.output.mu.code, 3)
  t.end()
})

test('mue.remoteWrap uses prexisting code on mu error object if muCode is absent', function (t) {
  var muErr = mue()
  var err = JSON.parse(JSON.stringify(muErr(3)))
  muErr.wrapRemote(err)
  t.is(err.output.mu.code, 3)

  err = JSON.parse(JSON.stringify(muErr(3)))
  delete err.output.mu
  muErr.wrapRemote(err)
  t.is(err.output.mu.code, 1)

  err = JSON.parse(JSON.stringify(muErr(3)))
  delete err.output.mu
  muErr.wrapRemote(err)
  t.is(err.output.mu.code, 1)

  err = JSON.parse(JSON.stringify(muErr(3)))
  delete err.output.mu
  muErr.wrapRemote(err, 2)
  t.is(err.output.mu.code, 2)

  t.end()
})

test('mue.wrapRemote always adds remoteStacks property', function (t) {
  var muErr = mue()
  var err = JSON.parse(JSON.stringify(muErr('test')))
  delete err.stack
  muErr.wrapRemote(err, 2, 400, 'test')
  t.ok(Array.isArray(err.remoteStacks))
  err = JSON.parse(JSON.stringify(err))
  delete err.stack
  muErr.wrapRemote(err, 2, 400, 'test')
  t.is(err.remoteStacks.length, 0)
  t.end()
})

test('mue.wrapRemote does not add to remoteStacks if no stack property', function (t) {
  var muErr = mue()
  var err = JSON.parse(JSON.stringify(muErr('test')))
  delete err.stack
  muErr.wrapRemote(err, 2, 400, 'test')
  t.is(err.remoteStacks.length, 0)
  t.end()
})

test('mue.extract provides mu context at top level, with payload and data keys', function (t) {
  t.deepEqual(mue.extract(mue()('test')), {
    code: 1,
    error: 'service error',
    message: 'test',
    data: null,
    payload: {
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'An internal server error occurred'
    }
  })
  t.end()
})

test('mue.extract throws if err is a mu error object', function (t) {
  t.throws(() => mue.extract({err: 'oh oh'}))
  t.throws(() => mue().extract(mue()(400)))
  t.end()
})

test('unknown mu code results in "unknown" error type', function (t) {
  var muErr = mue()
  t.deepEqual(
    muErr(99).output.mu,
    { code: 99, error: MU_CODES[99], message: undefined }
  )
  t.deepEqual(
    muErr(98).output.mu,
    { code: 98, error: MU_CODES[99], message: undefined }
  )
  t.end()
})

test('mue.service returns error with mu code 1', function (t) {
  var muErr = mue()
  t.deepEqual(
    muErr.service('test').output.mu,
    { code: ERRORS.SERVICE, error: MU_CODES[ERRORS.SERVICE], message: 'test' }
  )
  t.end()
})

test('mue.framework returns error with mu code 2', function (t) {
  var muErr = mue()
  t.deepEqual(
    muErr.framework('test').output.mu,
    { code: ERRORS.FRAMEWORK, error: MU_CODES[ERRORS.FRAMEWORK], message: 'test' }
  )
  t.end()
})

test('mue.transport returns error with mu code 3', function (t) {
  var muErr = mue()
  t.deepEqual(
    muErr.transport('test').output.mu,
    { code: ERRORS.TRANSPORT, error: MU_CODES[ERRORS.TRANSPORT], message: 'test' }
  )
  t.end()
})

test('convenience methods wrap Error and boom objects', function (t) {
  var muErr = mue()
  var err = muErr.service(Error('test'))
  t.deepEqual(
    err.output.mu,
    { code: ERRORS.SERVICE, error: MU_CODES[ERRORS.SERVICE], message: 'test' }
  )
  var err2 = muErr.framework(err)
  t.deepEqual(
    err2.output.mu,
    { code: ERRORS.FRAMEWORK, error: MU_CODES[ERRORS.FRAMEWORK], message: 'test' }
  )
  var err3 = muErr.transport(err2)
  t.deepEqual(
    err3.output.mu,
    { code: ERRORS.TRANSPORT, error: MU_CODES[ERRORS.TRANSPORT], message: 'test' }
  )
  var err4 = muErr.transport(muErr(400))
  t.deepEqual(
    err4.output.mu,
    { code: ERRORS.TRANSPORT, error: MU_CODES[ERRORS.TRANSPORT], message: 'Bad Request' }
  )
  var err5 = muErr.transport(muErr())
  t.deepEqual(
    err5.output.mu,
    { code: ERRORS.TRANSPORT, error: MU_CODES[ERRORS.TRANSPORT], message: undefined }
  )
  t.end()
})

test('serializeErrorProps option serializes stack and message when true', function (t) {
  var muErr = mue({serializeErrorProps: false})
  var o = JSON.parse(JSON.stringify(muErr('test')))
  t.notOk(o.stack)
  t.notOk(o.message)
  muErr = mue({serializeErrorProps: true})
  o = JSON.parse(JSON.stringify(muErr('test')))
  t.ok(o.stack)
  t.is(o.message, 'test')
  t.end()
})

test('serializeErrorProps option defaults to true', function (t) {
  var muErr = mue()
  var o = JSON.parse(JSON.stringify(muErr('test')))
  t.ok(o.stack)
  t.is(o.message, 'test')
  t.end()
})

test('maxRemoteStacks option controls total amount of remote stacks', function (t) {
  var muErr = mue({maxRemoteStacks: 3})
  var err = JSON.parse(JSON.stringify(muErr('test')))
  muErr.wrapRemote(err)
  t.ok(Array.isArray(err.remoteStacks))
  t.is(err.remoteStacks.length, 1)
  err = JSON.parse(JSON.stringify(err))
  muErr.wrapRemote(err)
  t.is(err.remoteStacks.length, 2)
  err = JSON.parse(JSON.stringify(err))
  muErr.wrapRemote(err)
  t.is(err.remoteStacks.length, 3)
  err = JSON.parse(JSON.stringify(err))
  muErr.wrapRemote(err)
  t.is(err.remoteStacks.length, 3)
  err = JSON.parse(JSON.stringify(err))
  muErr.wrapRemote(err)
  t.is(err.remoteStacks.length, 3)
  t.end()
})

function fnName (fn) {
  var rx = /^\s*function\s*([^\(]*)/i
  var match = rx.exec(fn)
  return match && match[1]
}
