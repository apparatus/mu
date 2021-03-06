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
var proxyquire = require('proxyquire')
var redisMock = require('fakeredis')
var driver = proxyquire('../../../packages/mu-redis/driver', {redis: redisMock})
var rdis = proxyquire('../../../packages/mu-redis', {driver: driver})

// write separate redis test 2 senders 1 reciever sendres to send 100x each and ensure that each gets back exactly
// correct response -> count and validate

function init (cb) {
  require('../../system/service1/service')(function (s1) {
    s1.inbound('*', rdis.server({port: 6379, host: '127.0.0.1', list: 's1'}))
    require('../../system/service2/service')(function (s2) {
      s2.inbound('*', rdis.server({port: 6379, host: '127.0.0.1', list: 's2'}))
      cb(s1, s2)
    })
  })
}


test('consume services with redis transport test', function (t) {
  t.plan(1)

  init(function (s1, s2) {
    var consumer = require('../../system/consumer/consumer')()
    consumer.mu.outbound({role: 's1'}, rdis.client({port: 6379, host: '127.0.0.1', list: 's1'}))
    consumer.mu.outbound({role: 's2'}, rdis.client({port: 6379, host: '127.0.0.1', list: 's2'}))
    consumer.consume(function (err, result) {
      t.equal(err, null, 'check err is null')
      consumer.mu.tearDown()
      s1.tearDown()
      s2.tearDown()
    })
  })
})

