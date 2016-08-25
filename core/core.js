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
var crypto = require('crypto')
var defaultLogger = require('./log')
var errors = require('./err')
var transport = require('./transport')



module.exports = function (options) {
  var logger = (options && options.logger) || defaultLogger.create(defaultLogger.levelInfo)
  var router = require('./router')(logger)

  if (options && options.logLevel) {
    logger.setLevel(options.logLevel)
  }


  function define (pattern, tf) {
    assert(pattern, 'define requires a valid pattern')
    assert(tf, 'define requires a valid transport or pattern handler')
    logger.debug('adding pattern route: ' + pattern)

    if (typeof tf === 'function') {
      router.addRoute(pattern, {muid: uuid(), tf: tf, type: 'handler'})
    }
    else {
      router.addRoute(pattern, tf)
    }
  }



  function dispatch (message, cb) {
    var hash
    var digest

    assert(message, 'dispatch requires a valid message')
    assert(cb && (typeof cb === 'function'), 'dispatch requries a valid callback handler')
    logger.debug('dispatching message: ' + message)

    if (!(message.pattern || message.response)) {
      hash = crypto.createHash('sha256')
      hash.update('' + cb)
      digest = hash.digest('hex')
      router.addRoute(null, {muid: digest, tf: cb, type: 'callback'})
      router.route({pattern: message, protocol: {path: [digest], trace: [digest], ttl: 10}}, cb)
    }
    else {
      router.route(message, cb)
    }
  }



  function tearDown () {
    router.tearDown()
  }



  function print () {
    return router.print()
  }



  var instance = {
    define: define,
    dispatch: dispatch,
    tearDown: tearDown,
    print: print,
    log: logger,
    transportList: function () { return router.transportList() }
  }
  instance.transports = require('../transports/transports')(instance, transport)

  return instance
}


module.exports.log = {levelTrace: defaultLogger.levelTrace,
                      levelDebug: defaultLogger.levelDebug,
                      levelInfo: defaultLogger.levelInfo,
                      levelWarn: defaultLogger.levelWarn,
                      levelError: defaultLogger.levelError,
                      levelFatal: defaultLogger.levelFatal}

module.exports.errors = {SERVICE_ERR: errors.SERVICE_ERR,
                         FRAMEWORK_ERR: errors.FRAMEWORK_ERR,
                         TRANSPORT_ERR: errors.TRANSPORT_ERR}

