'use strict'

var boom = require('boom')

if (!Error.captureStackTrace) {
  Error.captureStackTrace = function noop () {}
}

module.exports = muError

var MU_CODES = {
  1: 'service error',
  2: 'framework error',
  3: 'transport error',
  99: 'unknown'
}
var ERRORS = {
  SERVICE: 1,
  FRAMEWORK: 2,
  TRANSPORT: 3,
  UNKNOWN: 99
}

muError.MU_CODES = MU_CODES
muError.ERRORS = ERRORS
muError.extract = extract

function extract (err) {
  if (!err.isMu) {
    throw Error('mu-error: extract must have a mu error object')
  }
  return Object.assign({}, err.output.mu, {
    data: err.data,
    payload: err.output.payload
  })
}

function muError (opts) {
  opts = opts || {}
  var dev = opts.dev
  var httpCode = opts.httpCode || 500
  var serializeErrorProps = opts.serializeErrorProps !== undefined
    ? opts.serializeErrorProps
    : true
  var maxRemoteStacks = opts.maxRemoteStacks || (dev ? Infinity : 20)

  function mue (statusCode, message, data) {
    if (typeof statusCode === 'string' || statusCode === undefined) {
      return monoMorphMuError(1, statusCode || '', message || null)
    }

    return monoMorphMuError(statusCode, message || '', data || null)
  }

  function makeMuError (muCode, httpCode, message, data) {
    return ctx(boom.create(httpCode, message, data), muCode, message)
  }

  function errorise (error) {
    var message = error.message || (error.isMu
      ? error.output.mu.message
      : error.output.payload.message)

    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(error, Error.prototype)
    } else {
      /* eslint no-proto: 0 */
      error.__proto__ = Error.prototype
    }

    Object.defineProperty(error, 'message', {
      value: message,
      writable: true,
      enumerable: false,
      configurable: true
    })
    if (error.stack) {
      Object.defineProperty(error, 'stack', {
        value: error.stack,
        writable: true,
        enumerable: false,
        configurable: true
      })
    }

    return error
  }

  function wrap (error, muCode, statusCode, message, data) {
    if (error == null) { return error }
    if (!(error instanceof Error)) {
      // probably been serialized:
      if (error.isBoom) {
        error = errorise(error)
      } else {
        throw Error('mu-error: must be an Error or Boom object')
      }
    }
    var alreadyIs = error.isMu && error.output && error.output.mu && error.output.mu.code === muCode
    if (alreadyIs) {
      return error
    }
    muCode = muCode || 1
    if (error.isBoom) {
      var msg = (error.output.mu ? error.output.mu.message : error.output.payload.message)
      message = (message && msg
        ? message + ': ' + msg
        : msg) || message
      return ctx(error, muCode, message)
    }
    var err = boom.wrap(error, statusCode || httpCode, message)
    return ctx(err, muCode, error.message)
  }

  function wrapRemote (error, muCode, statusCode, message, data) {
    if (error == null) { return error }
    if (error.output && error.output.mu) {
      muCode = muCode || error.output.mu.code
    }
    wrap(error, muCode, statusCode, message, data)
    error.remoteStacks = error.remoteStacks || []

    if (error.stack) {
      if (error.remoteStacks.length >= maxRemoteStacks) {
        error.remoteStacks.splice(0, error.remoteStacks.length - maxRemoteStacks + 1)
      }
      error.remoteStacks.push({
        timestamp: Date.now(),
        stack: error.stack
      })
    }
    error.stack = Error(error.message).stack
    preserveErrorInfo(error)
    return error
  }

  Object.assign(mue, boom)
  mue.create = mue
  mue.wrap = wrap
  mue.remote = wrapRemote
  mue.wrapRemote = wrapRemote
  mue.makeMuError = makeMuError
  mue.service = makeConvenienceMethod(ERRORS.SERVICE)
  mue.framework = makeConvenienceMethod(ERRORS.FRAMEWORK)
  mue.transport = makeConvenienceMethod(ERRORS.TRANSPORT)
  mue.extract = extract
  mue.MU_CODES = MU_CODES
  mue.ERRORS = ERRORS

  return mue

  function makeConvenienceMethod (code) {
    return function (message, data) {
      if (message instanceof Error) {
        if (message.isBoom) {
          message.output.payload.message = message.isMu ? message.output.mu.message : message.message
          message.isMu = false
        }
        return wrap(message, code, httpCode, undefined, data)
      }
      return mue(code, message, data)
    }
  }

  function ctx (err, muCode, message) {
    err.output.mu = {
      code: muCode,
      error: MU_CODES[muCode] || MU_CODES[99],
      message: message
    }
    if (dev) {
      err.output.payload.mu = err.output.mu
      if (err.data) {
        err.output.payload.mu.data = err.data
      }
    }
    if (!err.isMu) { preserveErrorInfo(err) }
    err.isMu = true
    return err
  }

  function monoMorphMuError (statusCode, message, data) {
    if (statusCode === 0 || statusCode >= 100 && statusCode < 400) {
      throw Error('first argument must be 1..99 or 400+')
    }
    message = message || undefined
    if (statusCode < 100) {
      return makeMuError(statusCode, httpCode, message, data)
    }
    var err = boom.create(statusCode, message, data)
    return preserveErrorInfo(err)
  }

  function preserveErrorInfo (err) {
    if (!serializeErrorProps || err.__preserving__) { return err }
    Object.defineProperty(err, '__preserving__', {value: true})
    Object.defineProperty(err, 'toJSON', {value: errToJson})
    return err
  }
}

function errToJson () {
  // have to reconfigure properties, to make them enumerable
  Object.defineProperty(this, 'stack', errJsonReset(this, 'stack'))
  Object.defineProperty(this, 'message', errJsonReset(this, 'message'))

  return this
}

function errJsonReset (o, k) {
  return {
    value: {
      self: o,
      value: o[k],
      toJSON: selfReset
    },
    enumerable: true
  }
}

function selfReset (k) {
  Object.defineProperty(this.self, k, {
    value: this.value,
    enumerable: false
  })
  return this.value
}
