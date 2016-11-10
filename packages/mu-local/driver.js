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

var register = {}

/**
 * local function transport.
 * uses a singleton transport registry to connect to in
 * process mu instances
 */
module.exports = function createLocalDriver (options) {
  return function localDriver (opts, receive) {
    var target = options && options.target &&
      options.target.transports().filter(function (transport) {
        return (transport.driver &&
          transport.driver.type === 'func')
      })
    target = target && target[target.length - 1].driver

    assert(opts, 'transport should always pass opts to localDriver')
    assert(receive instanceof Function, 'transport should always pass receive function to localDriver')

    var id = opts.id

    register[id] = {
      type: 'func',
      send: send,
      call: call,
      tearDown: tearDown
    }

    return register[id]

    function send (message) {
      var tx = message.protocol.dst === 'target'
        ? target
        : register[message.protocol.dst]
      tx.call(message)
    }

    function call (message) {
      receive(null, message)
    }

    function tearDown (cb) {
      if (cb) cb()
    }
  }
}
