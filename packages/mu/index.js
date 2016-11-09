/*
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES LOSS OF USE, DATA, OR PROFITS OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

'use strict'

var assert = require('assert')
var uuid = require('uuid')
var pino = require('pino')
var muError = require('mu-error')
var createRouter = require('mu-router')
var DEFAULT_TTL = 10

function createMu (opts) {
  opts = opts || {}
  // see mu-error for error options
  opts.errors = opts.errors || {}
  var logger = opts.logger || pino()
  var dev = opts.dev
  var mue = muError(Object.assign({
    dev: dev
  }, opts.errors))
  var router = createRouter({logger: logger, mue: mue})

  if (opts.logLevel) {
    logger.level = opts.logLevel
  }

  var instance = {
    inbound: inbound,
    outbound: outbound,
    define: define,
    dispatch: dispatch,
    tearDown: router.tearDown,
    print: router.print,
    log: logger,
    error: mue,
    DEV_MODE: dev,
    transports: router.transports
  }

  return instance

  function define (pattern, tf) {
    assert(pattern, 'define requires a valid pattern')
    assert(tf, 'define requires a valid transport or pattern handler')
    logger.debug('adding pattern route: ' + pattern)

    if (typeof tf === 'function') {
      router.addRoute(pattern, {muid: uuid(), tf: tf, type: 'handler'})
    } else {
      router.addRoute(pattern, tf)
    }
  }

  function inbound (pattern, tf) {
    define(pattern, tf(instance, {direction: 'inbound'}))
  }

  function outbound (pattern, tf) {
    define(pattern, tf(instance, {direction: 'outbound'}))
  }

  function dispatch (message, cb) {
    var id = uuid()
    cb = cb || noop
    assert(message, 'dispatch requires a valid message')
    assert(typeof cb === 'function', 'dispatch requires a valid callback handler')
    logger.debug('dispatching message: ' + message)

    if (!(message.pattern || message.response)) {
      router.addRoute(null, {muid: id, tf: cb, type: 'callback'})
      router.route({pattern: message, protocol: {path: [id], trace: [id], ttl: DEFAULT_TTL}}, cb)
      return
    }

    router.route(message, cb)
  }
}

function noop () {}

createMu.log = Object.keys(pino.levels.values).reduce((acc, key) => {
  acc['level' + key[0].toUpperCase() + key.slice(1)] = key
  return acc
}, {})

module.exports = createMu
