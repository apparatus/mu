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
var mu = require('../../../core/core')()
var tcp = require('../../../drivers/tcp')
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
