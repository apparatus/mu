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
var DEFAULT_TTL = 10



/**
 * responsible for the protocol implementation
 *  {pattern: { pattern and data }, proto: { path: [1234, 4567],    trace: [1234, 4567], ttl: 9}}
 *  {response: { response data }, proto: { path: [1234], dst: 4567, trace: [1234, 4567, 6789], ttl: 8}}
 */
module.exports = function (driver) {
  var muid = uuid()
  var mu

  driver.setId(muid)
  driver.receive(function (err, message) {
    if (err) { mu.log.error('err: ' + err) }
    mu.log.debug('node: ' + muid + ' <- ' + JSON.stringify(message))

    mu.dispatch(message, function (err, response) {
      var packet

      if (err) {
        // handle errors here?
        mu.log.error('err: ' + err)
      }
      else {
        if (response && response.protocol) {
          packet = response
        }
        else {
          if (!response) {
            response = {}
          }
          packet = {response: response, protocol: message.protocol}
        }

        packet.protocol.trace.push(muid)
        packet.protocol.src = muid
        packet.protocol.dst = packet.protocol.path.pop()
        mu.log.debug('node: ' + muid + ' -> ' + JSON.stringify(packet))
        driver.send(packet)
      }
    })
  })



  function tf (message, cb) {
    assert(message)
    assert(cb && (typeof cb === 'function'), 'transport requries a valid callback handler')

    if (!message.protocol) {
      message.protocol = {path: [], trace: [], ttl: DEFAULT_TTL}
    }
    if (message.pattern) {
      message.protocol.path.push(muid)
    }
    if (!message.protocol.dst) {
      message.protocol.dst = 'target'
    }

    message.protocol.src = muid
    message.protocol.trace.push(muid)

    mu.log.debug('node: ' + muid + ' -> ' + JSON.stringify(message))
    driver.send(message, function (err) {
      if (err) { return cb(err) }
    })
  }



  function setMu (muInstance) {
    mu = muInstance
  }



  function setId (id) {
    muid = id
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

