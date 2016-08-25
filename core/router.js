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
var _ = require('lodash')
var errors = require('./err')



/**
 * pattern router. responsible for the routing table
 */
module.exports = function (logger) {
  var patrun = require('patrun')()
  var defaultTf = null
  var idmap = {}


  var addRoute = function addRoute (pattern, tf) {
    assert(tf, 'addRoute requires a valid handler or transport function')
    assert(tf.type && (tf.type === 'handler' || tf.type === 'transport' || tf.type === 'callback'), 'addRoute requires a known type')

    if (pattern) {
      if (_.isString(pattern) && pattern === '*') {
        logger.debug('adding default route')
        defaultTf = tf
      }
      else {
        patrun.add(pattern, tf)
      }
    }
    idmap['' + tf.muid] = tf
  }



  var removeRoute = function (pattern) {
    assert(pattern, 'removeRoute requries a valid pattern')

    if (_.isString(pattern) && pattern === '*') {
      logger.debug('removing default route')
      idmap[defaultTf.muid] = null
      defaultTf = null
    }
    else {
      var tf = patrun.find(pattern)
      if (tf) {
        logger.debug('removing route: ' + pattern)
        idmap[tf.muid] = null
        patrun.remove(pattern)
      }
    }
  }



  /**
   * main routing function
   */
  var route = function route (message, cb) {
    assert(message, 'route requries a valid message')
    assert(cb && (typeof cb === 'function'), 'route requries a valid callback handler')

    if (message && message.pattern) {
      var tf = patrun.find(message.pattern)

      if (!tf && defaultTf) {
        logger.debug('using default route for: ' + message.pattern)
        tf = defaultTf
      }

      if (tf) {

        // message will be handled in this process instance. In this case just reflect the error and
        // response parameters back to the callback handler. This will either be local in the case of a single
        // process instance or more likely in transport.js. This will pack the error and response paramters into
        // a protocol packet send
        if (tf.type === 'handler') {
          tf.tf(message, function (err, response) {
            cb(err, response)
          })
        }

        // message will be sent to this transport handler. In this case the error paramter signals an internal error
        // condition within the transport handler, for example a socket timeout. In this instance the error message will
        // be logged and an exception thrown. This will result in this node crashing and restarting - this is by design
        else if (tf.type === 'transport') {
          tf.tf(message, function (err) {
            if (err) { return cb(err) }
          })
        }
        else {

          // a transport function was provided but of an unknown type, this should never happen, crash...
          assert(false, 'Routing error unspecificed type.')
        }
      }
      else {

        // unable to find a route, discard message
        logger.error('Routing error no matching route and no defualt route provided, Message will be discarded')
        logger.debug(JSON.stringify(message))
        cb({type: errors.TRANSPORT_ERR, message: 'Routing error no matching route and no defualt route provided, Message will be discarded', data: message})
      }
    }
    else if (message && message.response) {
      assert(message.protocol)

      var muid = message.protocol.path[message.protocol.path.length - 1]
      if (idmap[muid]) {
        if (idmap[muid].type === 'callback') {
          idmap[muid].tf(null, message)
        }
        else {
          idmap[muid].tf(message, function (err, response) {
            cb(err, response)
          })
        }
      }
      else {

        // missing both pattern and response fields, this should never happen, discard packet...
        logger.error('Malformed packet no pattern or response field. Message will be discarded')
        logger.debug(JSON.stringify(message))
        cb({type: errors.TRANSPORT_ERR, message: 'Malformed packet no pattern or response field. Message will be discarded', data: message})

        logger.error('routing error no available response transport function for: ' + JSON.stringify(message))
        cb('routing error no available response transport function for: ' + JSON.stringify(message))
      }
    }
    else {

      // missing both pattern and response fields, this should never happen, discard packet...
      logger.error('Malformed packet no pattern or response field. Message will be discarded')
      logger.debug(JSON.stringify(message))
      cb({type: errors.TRANSPORT_ERR, message: 'Malformed packet no pattern or response field. Message will be discarded', data: message})
    }
  }



  var tearDown = function tearDown () {
    patrun.list().forEach(function (el) {
      if (el.tearDown) { el.tearDown() }
    })
    if (defaultTf && defaultTf.tearDown) {
      defaultTf.tearDown()
    }
  }



  var transportList = function transportList () {
    var result = []

    patrun.list().forEach(function (el) {
      result.push(el)
    })
    if (defaultTf) {
      result.push(defaultTf)
    }

    return result
  }



  var print = function print () {
    var result = ''

    result += 'patterns:\n'
    patrun.list().forEach(function (el) {
      result += JSON.stringify(el.match) + ' -> ' + el.data.type + '\n'
    })
    if (defaultTf) {
      result += '* -> ' + defaultTf.type + '\n'
    }

    return result
  }



  return {
    addRoute: addRoute,
    removeRoute: removeRoute,
    route: route,
    tearDown: tearDown,
    print: print,
    transportList: transportList
  }
}

