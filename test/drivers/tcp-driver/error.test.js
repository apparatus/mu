/*
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

'use strict'

var test = require('tap').test
var createMu = require('../../../packages/mu')
var mu = createMu()
var tcp = require('../../../packages/mu-tcp')
var net = require('net')
var errorService = require('../../system/errorService/service')

function init (cb) {
  errorService(function (errSvc) {
    errSvc.inbound('*', tcp.server({port: 3001, host: '127.0.0.1'}))
    cb(errSvc)
  })
}

test('test no service', function (t) {
  mu.outbound('*', tcp.client({port: 3001, host: '127.0.0.1'}))
  mu.dispatch({role: 'wibble', cmd: 'fish'}, function (err, result) {
    mu.tearDown()
    t.ok(err instanceof Error)
    t.is(err.isBoom, true)
    t.is(err.isMu, true)
    t.is(err.code, 'ECONNREFUSED', 'check connection refused')
    t.end()
  })
})

test('test mangled data received by server', function (t) {
  var server = createMu()
  var childLogger = server.log.child({})
  server.log.child = function () {
    return Object.assign(childLogger, {
      error: function (err) {
        t.ok(err, 'error sent to logger')
        t.ok(err instanceof Error, 'is instance of Error')
        t.ok(err instanceof SyntaxError, 'is instance of SyntaxError')
        t.is(err.message.slice(0, 16), 'Unexpected token', 'message is unexpected token')
      }
    })
  }

  server.inbound('*', tcp.server({port: 3001, host: '127.0.0.1'}))
  var socket = net.connect(3001, '127.0.0.1')
  socket.write(Buffer.from('99027c227061747465726e223a7b226869223a22796f75227d2c2270726f746f636f6c223a7b2270617468223a5b2261336137666336312d343661652d343462352d626535352d613731343639646336393139222c2237393930396339302d303739392d346361302d396530612d623636356663303231623932225d2c227472616365223a5b2261336137666336312d343661652d343462352d626535352d613731343639646336393139222c2237393930396339302d303739392d346361302d396530612d623636356663303231623932225d2c2274746c223a31302c22647374223a22746172676574222c22737263223a2237393930396339302d303739392d346361302d396530612d623636356663303231623932227d7d', 'hex'))
  socket.on('close', function () {
    t.pass('server closed socket')
    server.tearDown()
    t.end()
  })
})

test('test mangled data received by client', function (t) {
  var server = net.createServer(function (socket) {
    socket.write(Buffer.from('99027c227061747465726e223a7b226869223a22796f75227d2c2270726f746f636f6c223a7b2270617468223a5b2261336137666336312d343661652d343462352d626535352d613731343639646336393139222c2237393930396339302d303739392d346361302d396530612d623636356663303231623932225d2c227472616365223a5b2261336137666336312d343661652d343462352d626535352d613731343639646336393139222c2237393930396339302d303739392d346361302d396530612d623636356663303231623932225d2c2274746c223a31302c22647374223a22746172676574222c22737263223a2237393930396339302d303739392d346361302d396530612d623636356663303231623932227d7d', 'hex'))
    socket.on('close', function () {
      t.pass('client closed socket')
      client.tearDown()
      server.close()
      t.end()
    })
  }).listen(3001)

  var client = createMu()
  var childLogger = client.log.child({})
  client.log.child = function () {
    return Object.assign(childLogger, {
      error: function (err) {
        t.ok(err, 'error sent to logger')
        t.ok(err instanceof Error, 'is instance of Error')
        t.ok(err instanceof SyntaxError, 'is instance of SyntaxError')
        t.is(err.message.slice(0, 16), 'Unexpected token', 'message is unexpected token')
      }
    })
  }
  client.outbound('*', tcp.client({port: 3001, host: '127.0.0.1'}))
  client.dispatch({hi: 'you'}, function (err) {
    console.log(err)
  })
})

test('test match nothing', function (t) {
  init(function (errSvc) {
    mu.outbound('*', tcp.client({port: 3001, host: '127.0.0.1'}))
    mu.dispatch({role: 'wibble', cmd: 'fish'}, function (err, result) {
      mu.tearDown()
      t.ok(err instanceof Error)
      t.is(err.isBoom, true)
      t.is(err.isMu, true)
      err = mu.error.extract(err)
      t.is(err.code, mu.error.ERRORS.TRANSPORT)
      t.is(err.message, 'Routing error: no valid outbound route available. Message will be discarded')
      errSvc.tearDown()
      t.end()
    })
  })
})

test('test match partial', function (t) {
  init(function (errSvc) {
    mu.outbound('*', tcp.client({port: 3001, host: '127.0.0.1'}))
    mu.dispatch({role: 'error', cmd: 'fish'}, function (err, result) {
      mu.tearDown()
      t.ok(err instanceof Error)
      t.is(err.isBoom, true)
      t.is(err.isMu, true)
      err = mu.error.extract(err)
      t.is(err.code, mu.error.ERRORS.TRANSPORT)
      t.is(err.message, 'Routing error: no valid outbound route available. Message will be discarded')
      errSvc.tearDown()
      t.end()
    })
  })
})

test('service returning inbound error', function (t) {
  init(function (errSvc) {
    mu.outbound('*', tcp.client({port: 3001, host: '127.0.0.1'}))
    mu.dispatch({role: 'error', cmd: 'error'}, function (err, result) {
      mu.tearDown()
      t.ok(err instanceof Error)
      t.is(err.isBoom, true)
      t.is(err.isMu, true)
      err = mu.error.extract(err)
      t.is(err.code, mu.error.ERRORS.SERVICE)
      t.is(err.message, 'oh fek', 'check error response')
      errSvc.tearDown()
      t.end()
    })
  })
})

