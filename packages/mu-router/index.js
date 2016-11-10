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

var bloomrun = require('bloomrun')
var assert = require('assert')
var stringify = require('fast-safe-stringify')
var parallel = require('fastparallel')()

var MALFORMED_PACKET = 'Malformed packet no pattern or response field. Message will be discarded'
var NO_MATCHING_ROUTE = 'Routing error: no matching route and no default route provided, Message will be discarded'
var INVALID_OUTBOUND_ROUTE = 'Routing error: no valid outbound route available. Message will be discarded'
var NO_AVAILABLE_TRANSPORT = 'Routing error: no available response transport function'

/**
 * pattern router. responsible for the routing table
 */
module.exports = function (opts) {
  var logger = opts.logger
  var mue = opts.mue
  var run = bloomrun({indexing: 'depth'})
  var idmap = {}

  return {
    addRoute: addRoute,
    route: route,
    tearDown: tearDown,
    print: print,
    transports: transports
  }

  function addRoute (pattern, tf) {
    assert(tf, 'addRoute requires a valid handler or transport function')
    assert(tf.type && (tf.type === 'handler' || tf.type === 'transport' || tf.type === 'callback'), 'addRoute requires a known type')

    idmap[tf.muid] = tf

    if (!pattern) return

    if (typeof pattern !== 'string') {
      run.add(pattern, tf)
      return
    }

    if (pattern === '*') {
      logger.debug('adding default route')
      run.default(tf)
    }
  }

  /**
   * main routing function
   */
  function route (message, cb) {
    assert(message, 'route requries a valid message')
    assert(cb && (typeof cb === 'function'), 'route requires a valid callback handler')

    if (message.pattern) {
      return pattern(message, cb)
    }

    if (message.response) {
      return response(message, cb)
    }

    malformed(message, cb)
  }

  function tearDown (cb) {
    var list = run.list().map(function (el) {
      return el.tearDown
    }).filter(Boolean)

    if (!list.length) {
      if (cb) cb()
      return
    }
    if (cb) {
      parallel(null, list, null, cb)
      return
    }

    list.forEach(function (tearDown) { tearDown() })
  }

  function transports () {
    return run.list()
  }

  function print () {
    var result = ''

    result += 'patterns:\n'
    run.list(null, { payloads: true, patterns: true }).forEach(function (el) {
      if (el.default) {
        result += '*'
      } else {
        result += stringify(el.pattern)
      }
      result += ' : ' + el.payload.muid + ' (' + el.payload.type + ')' + '\n'
    })
    return result
  }

  function pattern (message, cb) {
    // we are routing an outbound message as there is a pattern attached to the message
    var match = run.lookup(message.pattern)

    if (!match) {
      // unable to find a route, discard message
      logger.error(NO_AVAILABLE_TRANSPORT)
      logger.debug(message, 'discarded message')
      cb(mue.transport(NO_AVAILABLE_TRANSPORT, message))
      return
    }

    assert(match.type, 'handler', 'pattern message type must be handler or transport')
    assert(match.type, 'transport', 'pattern message type must be handler or transport')

    // message will be handled in this process instance. In this case just reflect the error and
    // response parameters back to the callback handler. This will either be local in the case of a single
    // process instance or more likely in transport.js. This will pack the error and response paramters into
    // a protocol packet send

    if (match.type === 'handler') {
      logger.debug(message, 'handling message')
      match.tf(message, function (err, response) {
        cb(mue.wrap(err || null), response || {})
      })
      return
    }

    // main case: type === 'transport':

    // update the response routing information
    var muid = message.protocol.path[message.protocol.path.length - 1]
    if (!idmap[muid] && message.protocol.inboundIfc) {
      idmap[muid] = idmap[message.protocol.inboundIfc]
    }

    if (match.direction !== 'outbound') {
      logger.error(INVALID_OUTBOUND_ROUTE)
      cb(mue.transport(INVALID_OUTBOUND_ROUTE))
      return
    }

    // message will be sent to this transport handler. In this case the error paramter signals an internal error
    // condition within the transport handler, for example a socket timeout. In this instance the error message will
    // be logged and an exception thrown. This will result in this node crashing and restarting - this is by design
    match.tf(message, function (err) {
      if (err) {
        cb(mue.wrap(err))
      }
    })
  }

  function response (message, cb) {
    // we are routing a response message as there is a response block on the message and no pattern block
    assert(message.protocol, 'response message must have a protocol object')

    // pull the last muid in the chain
    var muid = message.protocol.path[message.protocol.path.length - 1]
    var match = idmap[muid]
    if (!match) {
      // there is no available transport or handler for this mu id, this should never happen, discard the packet...
      logger.error(NO_MATCHING_ROUTE)
      cb(mue.framework(NO_MATCHING_ROUTE, message))
      return
    }

    // we have a matching muid check if the response handler is in this instance of mu, it it is call the callback handler
    // this will be the last step in the distributed call chain. Otherwise the message is being routed through a transport layer
    // so call the tf and invoke the local callback once the message has been sent
    if (match.type === 'callback') {
      match.tf(mue.remote(message.err || null), message.response)
      return
    }

    match.tf(message, function (err, response) {
      cb(mue.wrap(err), response)
    })
  }

  function malformed (message, cb) {
    logger.error(MALFORMED_PACKET)
    logger.debug(message, 'malformed message')
    cb(mue.transport(MALFORMED_PACKET, message))
  }
}
