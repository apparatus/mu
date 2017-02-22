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

/**
 * Load balance transport adapter.
 * distributes requests round robin to each supplied transport
 */
module.exports = function balance (transports) {
  return function adapter (mu, opts) {
    assert(opts)

    var direction = opts.direction
    var muid = opts.id || uuid()
    var index = 0

    transports = transports.map(function (t) {
      return t(mu, {direction: direction, id: muid})
    })

    return {
      direction: transports[0].direction,
      muid: muid,
      tf: tf,
      tearDown: tearDown,
      type: 'transport'
    }

    function tf (message, cb) {
      transports[index].tf(message, cb)
      index++
      if (index >= transports.length) {
        index = 0
      }
    }

    function tearDown (cb) {
      var count = 0
      transports.forEach(function (transport) {
        transport.tearDown(function () {
          ++count
          if (count === transports.length) {
            cb && cb()
          }
        })
      })
    }
  }
}

