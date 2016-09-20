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
var mu = require('../../core/core')()
var tcp = require('../../drivers/tcp')



function init (cb) {
  require('./system/errorService/service')(function (errSvc) {
    errSvc.inbound('*', tcp.server({port: 3001, host: '127.0.0.1'}))
    cb(errSvc)
  })
}


test('test no service', function (t) {
  mu.outbound('*', tcp.client({port: 3001, host: '127.0.0.1'}))
  mu.dispatch({role: 'wibble', cmd: 'fish'}, function (err, result) {
    mu.tearDown()
    t.equal(err.code, 'ECONNREFUSED', 'check connection refused')
    t.end()
  })
})


test('test match nothing', function (t) {

  init(function (errSvc) {
    mu.outbound('*', tcp.client({port: 3001, host: '127.0.0.1'}))
    mu.dispatch({role: 'wibble', cmd: 'fish'}, function (err, result) {
      mu.tearDown()
      t.deepEqual(err, { message: 'Routing error: no valid outbound route available. Message will be discarded', type: 3 })
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
      t.deepEqual(err, { message: 'Routing error: no valid outbound route available. Message will be discarded', type: 3 })
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
      t.equal(err, 'oh fek', 'check error response')
      errSvc.tearDown()
      t.end()
    })
  })
})

