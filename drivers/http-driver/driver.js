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
var EventEmitter = require('events')

/**
 * HTTP transport. Simple HTTP POST Requests with JSON messages
 * [sig][len][JSON][sig][len][JSON]...
 */
module.exports = function (options) {
  var emitter = new EventEmitter()
  var connections = {}
  var server

  /**
   * recieve callback: function(err, msg)
   * - err indicate a local transport error NOT an error from the remote
   * - msg
   */
  function receive (cb) {
    emitter.on('receive', cb)
  }

  function send (message, cb) {
    if (!connections[message.protocol.dst]) {
      connections[message.protocol.dst] = http.request({
        port: options.target.port,
        hostname: options.target.host,
        method: 'POST',
        path: '/'
      })

      connections[message.protocol.dst].on('response', function (response) {
        var body = []
        var inbound

        response.on('data', function (chunk) {
          body.push(chunk)
        })

        response.on('end', function () {
          inbound = Buffer.concat(body)
          emitter.emit('receive', null, inbound.data)
        })
      })

      connections[message.protocol.dst].on('error', function (err) {
        connections[message.protocol.dst] = null
        cb(err || null, null)
      })
    }

    connections[message.protocol.dst].write(JSON.stringify(message))

    connections[message.protocol.dst].end(function () {
      connections[message.protocol.dst] = null
    })
  }

  function listen () {
    server = http.createServer()
    server.on('request', (request, response) => {
      var body = []
      var inbound

      request.on('data', function (chunk) {
        body.push(chunk)
      })

      request.on('end', function () {
        inbound = JSON.parse(Buffer.concat(body))
        emitter.emit('receive', null, inbound.data)

        response.writeHead(200, { 'Content-Type': 'text/plain' })
        response.end('ok')
      })
    })

    server.listen(options.source.port, options.source.host)
  }

  function tearDown () {
    // for (var conn in connections) {
    //   if (connections[conn]) {
    //     connections[conn].end()
    //   }
    // }

    if (server) {
      server.close()
    }
  }

  if (options.source && options.source.host && options.source.port) {
    listen()
  }

  return {
    type: 'http',
    send: send,
    receive: receive,
    tearDown: tearDown,
    setId: function (id) {}
  }
}
