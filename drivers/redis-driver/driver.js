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

var EventEmitter = require('events')
var redis = require('redis')


/**
 * options
 * {
 *   source { host, port, queue}
 *   target { host, port. queue}
 * }
 */
module.exports = function (options) {
  var emitter = new EventEmitter()
  var targetQueue = null
  var sourceQueue = null



  function receive (cb) {
    emitter.on('receive', cb)
  }



  if (options.target) {
    targetQueue = redis.createClient(options.target.port, options.target.host)
    targetQueue.on('ready', function () {
      targetQueue.on('error', function (err) {
        emitter.emit('receive', err, null)
      })
    })
  }



  function listen (cb) {
    if (!sourceQueue) {
      sourceQueue = redis.createClient(options.source.port, options.source.host)
      sourceQueue.on('ready', function () {
        sourceQueue.on('error', function (err) {
          emitter.emit('receive', err, null)
        })
      })
    }

    sourceQueue.on('message', function (channel, str) {
      var message = JSON.parse(str)
      emitter.on('receive', null, message)
    })

    sourceQueue.subscribe(options.source.queue)
  }



  function send (message, cb) {
    if (targetQueue) {
      targetQueue.publish(options.target.queue, message)
    }
    if (sourceQueue) {
      sourceQueue.publish(options.target.queue, message)
    }
  }



  function tearDown () {
  }



  if (options.source && options.source.host && options.source.port) {
    listen()
  }

  return {
    type: 'redis',
    send: send,
    receive: receive,
    tearDown: tearDown,
    setId: function (id) { }
  }
}

