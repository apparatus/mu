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
var tcp = require('../../../packages/mu-tcp')
var service1 = require('../../system/service1/service')
var createConsumer = require('../../system/consumer/consumer')
var createMu = require('../../../packages/mu')

function init (cb) {
  service1(function (s1) {
    s1.inbound('*', tcp.server({port: 3001, host: '127.0.0.1'}))
    require('../../system/service2/service')(function (s2) {
      s2.inbound('*', tcp.server({port: 3002, host: '127.0.0.1'}))
      cb(s1, s2)
    })
  })
}

test('consume services with tcp transport test', function (t) {
  t.plan(1)

  init(function (s1, s2) {
    var consumer = createConsumer()
    consumer.mu.outbound({role: 's1'}, tcp.client({port: 3001, host: '127.0.0.1'}))
    consumer.mu.outbound({role: 's2'}, tcp.client({port: 3002, host: '127.0.0.1'}))
    consumer.consume(function (err, result) {
      t.equal(err, null, 'check err is null')
      consumer.mu.tearDown()
      s1.tearDown()
      s2.tearDown()
    })
  })
})

test('multi-dispatch same cb', function (t) {
  t.plan(18)

  var mu1 = createMu()
  var mu2 = createMu()
  mu1.inbound('*', tcp.server({port: 3003, host: '127.0.0.1'}))
  mu2.inbound('*', tcp.server({port: 3004, host: '127.0.0.1'}))
  mu2.outbound({role: 'multi-dispatch-test'}, tcp.client({port: 3003, host: '127.0.0.1'}))

  var count = 0
  var total = 0
  mu1.define({role: 'multi-dispatch-test', cmd: 'one'}, function (args, cb) {
    cb(null, {count: ++count, id: args.pattern.id})
  })

  function handler (err, result) {
    t.equal(null, err, 'check err is null')
    t.equal(result.count, ++total, 'check count is ' + total)
    t.equal(result.count, result.id, 'check count is ' + result.id)

    if (total === 6) {
      mu1.tearDown()
      mu2.tearDown()
    }
  }

  mu2.dispatch({role: 'multi-dispatch-test', cmd: 'one', id: 1}, handler)
  mu2.dispatch({role: 'multi-dispatch-test', cmd: 'one', id: 2}, handler)
  mu2.dispatch({role: 'multi-dispatch-test', cmd: 'one', id: 3}, handler)
  mu2.dispatch({role: 'multi-dispatch-test', cmd: 'one', id: 4}, handler)
  mu2.dispatch({role: 'multi-dispatch-test', cmd: 'one', id: 5}, handler)
  mu2.dispatch({role: 'multi-dispatch-test', cmd: 'one', id: 6}, handler)
})

