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
var _ = require('lodash')
var errors = require('./err')



/**
 * pattern router. responsible for the routing table
 */
module.exports = function (logger) {
  var run = bloomrun({ indexing: 'depth' })
  var idmap = {}

  var addRoute = function addRoute (pattern, tf) {
    assert(tf, 'addRoute requires a valid handler or transport function')
    assert(tf.type && (tf.type === 'handler' || tf.type === 'transport' || tf.type === 'callback'), 'addRoute requires a known type')

    if (pattern) {
      if (_.isString(pattern) && pattern === '*') {
        logger.debug('adding default route')
        run.default(tf)
      } else {
        run.add(pattern, tf)
      }
    }
    idmap['' + tf.muid] = tf
  }



  /**
   * main routing function
   */
  var route = function route (message, cb) {
    assert(message, 'route requries a valid message')
    assert(cb && (typeof cb === 'function'), 'route requries a valid callback handler')

    if (message && message.pattern) {

      // we are routing an outbound message as there is a pattern attached to the message
      var tf = run.lookup(message.pattern)

      if (tf) {

        // message will be handled in this process instance. In this case just reflect the error and
        // response parameters back to the callback handler. This will either be local in the case of a single
        // process instance or more likely in transport.js. This will pack the error and response paramters into
        // a protocol packet send
        if (tf.type === 'handler') {
          logger.debug(message, 'handling message')
          tf.tf(message, function (err, response) {
            cb(err || null, response || {})
          })
        } else if (tf.type === 'transport') {

          // update the repsponse routing information
          if (!idmap['' + message.protocol.path[message.protocol.path.length - 1]] && message.protocol.inboundIfc) {
            idmap['' + message.protocol.path[message.protocol.path.length - 1]] = idmap['' + message.protocol.inboundIfc]
          }

          // message will be sent to this transport handler. In this case the error paramter signals an internal error
          // condition within the transport handler, for example a socket timeout. In this instance the error message will
          // be logged and an exception thrown. This will result in this node crashing and restarting - this is by design
          if (tf.direction === 'outbound') {
            tf.tf(message, function (err) {
              if (err) { return cb(err) }
            })
          } else {
            logger.error('Routing error: no valid outbound route or handler available. Message will be discarded')
            cb({type: errors.TRANSPORT_ERR, message: 'Routing error: no valid outbound route available. Message will be discarded'})
          }
        }
      } else {

        // unable to find a route, discard message
        logger.error('Routing error no matching route and no defualt route provided, Message will be discarded')
        logger.debug(message, 'discarded message')
        cb({type: errors.TRANSPORT_ERR, message: 'Routing error no matching route and no defualt route provided, Message will be discarded', data: message})
      }
    } else if (message && message.response) {

      // we are routing a response message as there is a response block on the message and no pattern block
      assert(message.protocol)

      // pull the last muid in the chain
      var muid = message.protocol.path[message.protocol.path.length - 1]
      if (idmap[muid]) {

        // we have a matching muid check if the response handler is in this instance of mu, it it is call the callback handler
        // this will be the last step in the distributed call chain. Otherwise the message is being routed through a transport layer
        // so call the tf and invoke the local callback once the message has been sent
        if (idmap[muid].type === 'callback') {
          idmap[muid].tf(message.response.err || null, message.response)
        } else {
          idmap[muid].tf(message, function (err, response) {
            cb(err, response)
          })
        }
      } else {

        // there is no available transport or handler for this mu id, this should never happen, discard the packet...
        logger.error(message, 'routing error no available response transport function for')
        cb('routing error no available response transport function for: ' + JSON.stringify(message))
      }
    } else {

      // missing both pattern and response fields, this should never happen, discard packet...
      logger.error('malformed packet no pattern or response field. Message will be discarded')
      logger.debug(message, 'malformed message')
      cb({type: errors.TRANSPORT_ERR, message: 'Malformed packet no pattern or response field. Message will be discarded', data: message})
    }
  }



  var tearDown = function tearDown () {
    run.list().forEach(function (el) {
      if (el.tearDown) {
        el.tearDown()
      }
    })
  }



  var transportList = function transportList () {
    var result = []

    run.list().forEach(function (el) {
      result.push(el)
    })

    return result
  }



  var print = function print () {
    var result = ''

    result += 'patterns:\n'
    run.list(null, { payloads: true, patterns: true }).forEach(function (el) {
      if (el.default) {
        result += '*'
      } else {
        result += JSON.stringify(el.pattern)
      }
      result += ' : ' + el.payload.muid + ' (' + el.payload.type + ')' + '\n'
    })
    return result
  }



  return {
    addRoute: addRoute,
    route: route,
    tearDown: tearDown,
    print: print,
    transportList: transportList
  }
}
