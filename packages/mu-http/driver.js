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

var http = require('http')
var stringify = require('fast-safe-stringify')
var parse = require('fast-json-parse')
var assert = require('assert')
var mue = require('mu-error')()


/**
 * HTTP transport
 * Figure out path mapping - perhaps this may need to be part of the config for now just /
 */
module.exports = function createHttpDriver (options) {
  return function httpDriver (opts, receive) {
    var connections = {}
    var connectionsByIp = {}
    var server

    assert(opts, 'transport should always pass opts to httpDriver')
    assert(receive instanceof Function, 'transport should always pass receive function to httpDriver')

    server = options.source && listen(options.source.port, options.source.host, options.ready)

    if (!server && options.ready instanceof Function) {
      options.ready()
    }



    function send (message, cb) {
      var sendTo

      if (connections[message.protocol.dst]) {

        // server responding to client initaiated connection
        if (connections[message.protocol.dst].length > 0) {
          sendTo = connections[message.protocol.dst].pop()
          sendTo.response.writeHead(200, { 'Content-Type': 'application/json' })
          sendTo.response.write(stringify(message))
          sendTo.response.end()
        } else {
          cb(mue.transport('connection has alredy recieved response!'))
        }
      } else {

        // client initiating connection to server
        var body = []
        var inbound

        var req = http.request({host: options.target.host,
          port: options.target.port,
          method: 'POST',
          path: '/mu/',
          headers: {'Content-Type': 'application/json'}})

        req.on('response', function (response) {
          response.on('data', function (chunk) {
            body.push(chunk)
          })

          response.on('end', function () {
            if (response.statusCode !== 200) {
              receive(mue.transport(response.statusCode + ' ' + response.statusMessage), message)
              return
            }

            inbound = parse(Buffer.concat(body))
            receive(inbound.err, inbound.value)
          })
        })

        req.on('error', function (err) {
          cb(mue.transport(err))
        })

        req.end(stringify(message))
      }
    }



    function listen (port, host, ready) {
      return http.createServer(function (request, response) {
        var body = []
        var inbound

        request.on('data', function (chunk) {
          body.push(chunk)
        })

        request.on('end', function () {
          inbound = parse(Buffer.concat(body))

          assert(inbound.value.protocol.src)

          if (!connections[inbound.value.protocol.src]) {
            connections[inbound.value.protocol.src] = []
            connectionsByIp[request.socket.remoteAddress + '_' + request.socket.remotePort] = []
          }
          connections[inbound.value.protocol.src].push({request: request, response: response})
          connectionsByIp[request.socket.remoteAddress + '_' + request.socket.remotePort] = inbound.value.protocol.src
          receive(inbound.err, inbound.value)
        })
      }).listen(port, host, ready)
    }



    function tearDown (cb) {
      for (var conn in connections) {
        if (connections[conn] && connections[conn].length > 0) {
          var c = connections[conn].pop()
          c.response.end()
          c.request.destroy()
        }
      }
      if (!server && cb) {
        cb()
        return
      }
      if (server) {
        if (cb) {

          // should not be needed investigate
          setImmediate(function () {
            server.close(cb)
          })
          return
        }
        server.close()
      }
    }



    return {
      type: 'http',
      send: send,
      tearDown: tearDown
    }
  }
}

