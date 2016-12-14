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

var http = require('http')
var test = require('tap').test
var muHttp = require('../../../packages/mu-http')
var Mu = require('../../../packages/mu')
var service3 = require('../../system/service3/service')


function initFailServer (port, host, cb) {
  var server = http.createServer()

  server.on('request', function (request, response) {
    var body = []

    request.on('data', function (chunk) {
      body.push(chunk)
    })

    request.on('end', function () {
      response.writeHead(500, { 'Content-Type': 'application/json' })
      response.write(JSON.stringify({result: 'error'}))
      response.end()
      server.close()
    })
  })
  server.listen(port, host, cb)
}


function initService3 (cb) {
  service3(function (s3) {
    s3.inbound('*', muHttp.server({port: 3003, host: '127.0.0.1'}))
    s3.outbound({role: 's1'}, muHttp.client({port: 3001, host: '127.0.0.1'}))
    cb(s3)
  })
}


function initRouting (cb) {
  var router = Mu()
  router.inbound('*', muHttp.server({port: 3003, host: '127.0.0.1'}))
  router.outbound({role: 's1'}, muHttp.client({port: 3001, host: '127.0.0.1'}))
  cb(router)
}


test('force http protcol error single', function (t) {
  t.plan(1)
  var mu = Mu()

  mu.outbound('*', muHttp.client({port: 3001, host: '127.0.0.1'}))

  initFailServer(3001, '127.0.0.1', function () {
    mu.dispatch({role: 'test', cmd: 'one', fish: 'cheese'}, function (err, result) {
      t.equal(err.output.statusCode, 500)
    })
  })
})


test('force http protcol error chained', function (t) {
  t.plan(1)
  var mu = Mu()

  mu.outbound('*', muHttp.client({port: 3003, host: '127.0.0.1'}))

  initService3(function (s3) {
    initFailServer(3001, '127.0.0.1', function () {
      mu.dispatch({role: 's3', cmd: 'one'}, function (err, result) {
        t.equal(err.output.statusCode, 500)
        s3.tearDown()
      })
    })
  })
})


test('force http protcol error routed', function (t) {
  t.plan(1)
  var mu = Mu()

  mu.outbound('*', muHttp.client({port: 3003, host: '127.0.0.1'}))

  initRouting(function (router) {
    initFailServer(3001, '127.0.0.1', function () {
      mu.dispatch({role: 's1', cmd: 'one'}, function (err, result) {
        t.equal(err.output.statusCode, 500)
        router.tearDown()
      })
    })
  })
})

