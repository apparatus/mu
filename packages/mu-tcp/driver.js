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

var net = require('net')
var nos = require('net-object-stream')
var eos = require('end-of-stream')
var through = require('through2')
var stringify = require('fast-safe-stringify')
var Parse = require('fast-json-parse')
var pump = require('pump')
var assert = require('assert')
var mue = require('mu-error')()

/**
 * TCP transport. Simple protocol JSON messages delinated by two byte signature and length field
 * [sig][len][JSON][sig][len][JSON]...
 */
module.exports = function createTcpDriver (options) {
  return function tcpDriver (opts, receive) {
    var connections = {}
    var connectionsByIp = {}

    assert(opts, 'transport should always pass opts to tcpDriver')
    assert(receive instanceof Function, 'transport should always pass receive function to tcpDriver')

    var server = options.source &&
      listen(options.source.port, options.source.host, options.ready)

    if (!server && options.ready instanceof Function) {
      options.ready()
    }

    return {
      type: 'tcp',
      send: send,
      tearDown: tearDown
    }

    function send (message, cb) {
      var err = null
      if (!connections[message.protocol.dst]) {
        var socket = net.createConnection(options.target.port, options.target.host)
        connections[message.protocol.dst] = nos(socket, {codec: codec(socket)})
        connections[message.protocol.dst].socket = socket
        connections[message.protocol.dst].on('data', function (data) {
          if (data instanceof Error) {
            receive(data)
            socket.end()
            return
          }
          receive(null, data)
        })

        socket.on('error', function (err) { receive(mue.transport(err)) })
        socket.once('error', function (error) {
          err = error
        })
        eos(connections[message.protocol.dst], function () {
          connections[message.protocol.dst] = null
        })
      }

      connections[message.protocol.dst].write(message, cb && function () {
        setImmediate(function () { cb(err) })
      })
    }

    function listen (port, host, ready) {
      return net.createServer(function (socket) {
        socket = nos(socket, {codec: codec(socket)})

        var inbound = through.obj(function (data, _, cb) {
          if (data instanceof Error) {
            cb(data)
            return
          }

          if (!connections[data.protocol.src]) {
            connections[data.protocol.src] = socket
            connectionsByIp[socket.remoteAddress + '_' + socket.remotePort] = data.protocol.src
          }

          receive(null, data)
          cb()
        })

        pump(socket, inbound, socket, function (err) {
          connections[connectionsByIp[socket.remoteAddress + '_' + socket.remotePort]] = null
          connectionsByIp[socket.remoteAddress + '_' + socket.remotePort] = null
          if (err) { receive(mue.transport(err)) }
        })
      }).listen(port, host, ready)
    }

    function codec () {
      return {
        encode: stringify,
        decode: function decode (data) {
          var result = new Parse(data)
          if (result.err) {
            return mue.transport(result.err)
          }
          return result.value
        }
      }
    }

    function tearDown (cb) {
      for (var conn in connections) {
        if (connections[conn]) {
          connections[conn].end()
        }
      }
      if (!server && cb) {
        cb()
        return
      }
      if (server) {
        if (cb) {
          setImmediate(function () {
            server.close(cb)
          })
          return
        }
        server.close()
      }
    }
  }
}
