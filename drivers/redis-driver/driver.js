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
    var redis
    var rin = null
    var rout = null

    if (opts instanceof Function) {
      cb = opts
    }
    opts = opts || {}

    emitter.on('receive', cb)

    assert(options, 'redis driver requires an options object')

    if (options.source && options.source.redis) {
      redis = options.source.redis
    } else if (options.target && options.target.redis) {
      redis = options.target.redis
    } else {
      redis = require('redis')
    }

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
        listName = options.target.list + '_res'
      }

      var brpopQueue = function () {
        rin.brpop(listName, 1, function (err, data) {
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
        rout.lpush(options.source.list + '_res', stringify(message), function (err) {
          cb(err)
        })
      }
      if (options.target) {
        rout.lpush(options.target.list + '_req', stringify(message), function (err) {
          cb(err)
        })
      }
    }



    function tearDown () {
      tearingDown = true
      rin.quit()
      rout.quit()
    }
  }
}

