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
var cloneDeep = require('lodash.clonedeep')

/**
 * responsible for the protocol implementation
 *  {pattern: { pattern and data }, proto: { path: [1234, 4567], trace: [1234, 4567], ttl: 9}}
 *  {response: { response data }, proto: { path: [1234], dst: 4567, trace: [1234, 4567, 6789], ttl: 8}}
 */
module.exports = function transport (createDriver, mu, opts) {
  assert(opts, 'transport opts should always be defined')
  var direction = opts.direction
  var muid = opts.id || uuid()
  var logger = mu.log.child({muid: muid})
  var driver = createDriver({id: muid}, receive)

  return {
    muid: muid,
    tf: tf,
    direction: direction,
    type: 'transport',
    driver: driver,
    tearDown: driver.tearDown
  }

  function receive (err, msg) {
    logger.debug({in: msg}, 'message received')
    if (err) {
      // received an error condition from the driver,
      // typically this signals a failed client connection
      // or other inbound connection error condition.
      // In this case, log the error but make no attempt at
      // further routing
      logger.error(err)
      return
    }

    msg.protocol.inboundIfc = muid

    mu.dispatch(msg, function (err, response) {
      var message = cloneDeep(msg)
      response = response || {}
      var packet = {
        err: err,
        response: cloneDeep(response),
        protocol: message.protocol
      }
      packet.protocol.trace.push(muid)
      packet.protocol.src = muid
      packet.protocol.dst = packet.protocol.path.pop()
      logger.debug({out: packet}, 'sending response')
      driver.send(packet)
    })
  }

  function tf (msg, cb) {
    assert(msg)
    assert(msg.protocol)
    assert(cb && (typeof cb === 'function'),
      'transport requires a valid callback handler')

    var message = cloneDeep(msg)

    if (message.pattern) {
      message.protocol.path.push(muid)
    }
    if (!message.protocol.dst) {
      message.protocol.dst = 'target'
    }
    if (message.response) {
      message.protocol.dst = message.protocol.path.pop()
    }

    message.protocol.src = muid
    message.protocol.trace.push(muid)

    logger.debug({out: message}, 'sending via transport driver')
    driver.send(message, cb)
  }
}
