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
var EventEmitter = require('events')
var SIGNATURE = 4242



/**
 * TCP transport. Simple protocol JSON messages delinated by two byte signature and length field
 * [sig][len][JSON][sig][len][JSON]...
 */
module.exports = function (options) {
  var emitter = new EventEmitter()
  var connections = {}
  var connectionsByIp = {}
  var server



  /**
   * recieve callback: function(err, msg)
   * - err indicate a local transport error NOT an error from the remote
   * - msg
   */
  function receive (cb) {
    emitter.on('receive', cb)
  }



  function encode (message) {
    var payload = JSON.stringify(message)
    var buf = new Buffer(Buffer.byteLength(payload) + 4)

    buf.writeInt16BE(SIGNATURE, 0)
    buf.writeInt16BE(Buffer.byteLength(payload) + 4, 2)
    buf.write(payload, 4, 'ascii')
    return buf
  }



  function send (message, cb) {
    if (!connections[message.protocol.dst]) {
      connections[message.protocol.dst] = net.createConnection(options.target.port, options.target.host)

      connections[message.protocol.dst].on('connect', function () {
      })

      connections[message.protocol.dst].on('data', function (buf) {
        var inbound
        var index = 0

        do {
          inbound = parse(buf, index)
          if (inbound.data) {
            emitter.emit('receive', null, inbound.data)
          }
          index = inbound.index
        } while (inbound.data)
      })

      connections[message.protocol.dst].on('end', function () {
        connections[message.protocol.dst] = null
      })

      connections[message.protocol.dst].on('error', function (err) {
        connections[message.protocol.dst] = null
        if (cb) { cb(err || null, null) }
      })
    }
    connections[message.protocol.dst].write(encode(message))
  }



  function parse (buf, index) {
    var byteLength
    var sig = false
    var payload
    var result = null

    while (!sig && index < buf.length - 6) {
      if (buf.readInt16BE(index) === SIGNATURE) {
        sig = true
      }
      index += 1
    }
    index += 1

    if (sig) {
      byteLength = buf.readInt16BE(index)
      index += 2
      payload = buf.slice(index, index + byteLength - 4).toString()
      result = JSON.parse(payload)
    }
    return {index: index + byteLength - 4, data: result}
  }



  function listen () {
    server = net.createServer(function (c) {
      c.on('data', function (buf) {
        var inbound
        var index = 0

        do {
          inbound = parse(buf, index)
          if (inbound.data) {
            if (!connections[inbound.data.protocol.src]) {
              connections[inbound.data.protocol.src] = c
              connectionsByIp[c.remoteAddress + '_' + c.remotePort] = inbound.data.protocol.src
            }
            emitter.emit('receive', null, inbound.data)
          }
          index = inbound.index
        } while (inbound.data)
      })

      c.on('end', function () {
        connections[connectionsByIp[c.remoteAddress + '_' + c.remotePort]] = null
        connectionsByIp[c.remoteAddress + '_' + c.remotePort] = null
      })

      /*
      c.on('error', function (err) {
        connections[connectionsByIp[c.remoteAddress + '_' + c.remotePort]].destroy()
        connectionsByIp[c.remoteAddress + '_' + c.remotePort] = null
        emitter.emit('receive', err || null, null)
      })
      */
    })
    server.listen(options.source.port, options.source.host)
  }



  function tearDown () {
    for (var conn in connections) {
      if (connections[conn]) {
        connections[conn].end()
      }
    }
    if (server) {
      server.close()
    }
  }



  if (options.source && options.source.host && options.source.port) {
    listen()
  }

  return {
    type: 'tcp',
    send: send,
    receive: receive,
    tearDown: tearDown,
    setId: function (id) { }
  }
}

