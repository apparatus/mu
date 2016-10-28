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
    // Note: due to lack of documentation, I'm unable to follow the router logic here
    // seems this is triggered after emitting the recieve event on a response back from the server
    // putting in this if statements prevents it from hanging, but causes a loop
    if (!options.target) {
      return
    }

    // construct http request object
    // Note: https here can be a secondary option
    // Note: will be nice to add TLS certificate signing feature here
    let req = http.request({
      port: options.target.port,
      hostname: options.target.host,
      method: 'POST',
      path: '/', // Note: would be nice to relate URL paths to message paths as generated in the router
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // process the responses
    req.on('response', function (response) {
      var body = []
      var inbound

      response.on('data', function (chunk) {
        body.push(chunk)
      })

      response.on('end', function () {
        inbound = JSON.parse(Buffer.concat(body))

        // Note: this is the part that causes the loops as per the first note
        emitter.emit('receive', null, inbound)
      })
    })

    req.on('error', function (err) {
      cb(err || null, null)
    })

    // send the message
    req.write(JSON.stringify(message))
  }

  function listen () {
    server = http.createServer()
    server.on('request', function (request, response) {
      var body = []
      var inbound

      // capture the request data
      request.on('data', function (chunk) {
        body.push(chunk)
      })

      // process the request data
      request.on('end', function () {
        inbound = JSON.parse(Buffer.concat(body))

        emitter.emit('receive', null, inbound)

        // send headers and prep to close the connection
        response.writeHead(200, { 'Content-Type': 'application/json' })

        // Note: this doesn't feel right, going by the example of the tcp driver
        // there shouldn't be a manual response, yet it's needed by http
        response.end(JSON.stringify(inbound))
      })
    })

    server.listen(options.source.port, options.source.host)
  }

  function tearDown () {
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
