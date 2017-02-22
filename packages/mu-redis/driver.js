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
var stringify = require('fast-safe-stringify')
var assert = require('assert')
var redis = require('redis')


/**
 * options
 * {
 *   { host, port, list, redis - provide test redis client instance }
 * }
 * list should be service name, the driver will use two lists
 * <list>_req
 * <list>_res
 * servers (services)  will listen on _req and send on _res
 * clients (service invokers) will send on _req and listen on _res
 */
module.exports = function createRedisDriver (options) {
  return function redisDriver (opts, cb) {
    var emitter = new EventEmitter()
    var tearingDown = false
    var rin = null
    var rout = null

    assert(opts, 'transport should always pass opts to redis driver')
    assert(cb, 'transport should always pass cb to redis driver')

    emitter.on('receive', cb)

    assert(options, 'redis driver requires an options object')

    if (options.target) {
      rin = redis.createClient(options.target.port, options.target.host)
      rout = redis.createClient(options.target.port, options.target.host)
    }
    if (options.source) {
      rin = redis.createClient(options.source.port, options.source.host)
      rout = redis.createClient(options.source.port, options.source.host)
    }

    listen()

    return {
      type: 'redis',
      send: send,
      tearDown: tearDown
    }



    function listen (cb) {
      var listName

      if (options.source) {
        listName = options.source.list + '_req'
      }
      if (options.target) {
        // listName = options.target.list + '_res'
        listName = options.target.list + '_res_' + opts.id
      }

      var brpopQueue = function () {
        rin.brpop(listName, 5, function (err, data) {
          if (cb && err) {
            return cb(err)
          } else if (data) {
            var message = JSON.parse(data[1])
            emitter.emit('receive', null, message)
          }
          if (!tearingDown) {
            brpopQueue()
          }
        })
      }
      brpopQueue()
    }



    function send (message, cb) {
      if (options.source) {
        rout.lpush(options.source.list + '_res_' + message.protocol.dst, stringify(message), function (err) {
          cb && cb(err)
        })
      }
      if (options.target) {
        rout.lpush(options.target.list + '_req', stringify(message), function (err) {
          cb && cb(err)
        })
      }
    }



    function tearDown () {
      tearingDown = true
      rin.end(true)
      rout.end(true)
    }
  }
}

