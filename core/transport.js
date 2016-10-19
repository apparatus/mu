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
module.exports = function (driver) {
  var muid = uuid()
  var mu

  var logger

  driver.setId(muid)
  driver.receive(function (err, msg) {
    logger.debug({ in: msg }, 'message received')
    msg.protocol.inboundIfc = muid

    if (err) {

      // recieved an error condition from the driver, typically this signals a failed client connection or other
      // inbound connection error condition. In this case, log the error but make no attempt at further routing
      logger.error(err)
    } else {
      mu.dispatch(msg, function (err, response) {
        var packet

        var message = cloneDeep(msg)
        if (!response) {
          response = {}
        }
        if (err) {
          response.err = err
        }
        packet = {response: cloneDeep(response), protocol: message.protocol}
        packet.protocol.trace.push(muid)
        packet.protocol.src = muid
        packet.protocol.dst = packet.protocol.path.pop()
        logger.debug({ out: packet }, 'sending response')
        driver.send(packet)
      })
    }
  })



  function tf (msg, cb) {
    assert(msg)
    assert(msg.protocol)
    assert(cb && (typeof cb === 'function'), 'transport requries a valid callback handler')

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

    logger.debug({ out: message }, 'sending via transport driver')
    driver.send(message, function (err) {
      if (err) { return cb(err) }
    })
  }



  function setMu (muInstance) {
    mu = muInstance
    logger = mu.log.child({ muid })
  }



  function setId (id) {
    muid = id
    if (mu) {
      logger = mu.log.child({ muid })
    }
  }



  function tearDown () {
    driver.tearDown()
  }



  return {
    muid: muid,
    setMu: setMu,
    tf: tf,
    type: 'transport',
    setId: setId,
    driver: driver,
    tearDown: tearDown
  }
}
