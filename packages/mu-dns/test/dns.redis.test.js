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
var driver = proxyquire('../../mu-redis/driver', {redis: redisMock})
var rdis = proxyquire('../../mu-redis', {driver: driver})
var dnsMock = require('./support/dns.stub.js')()
proxyquire('concordant/dnsResolver', {dns: dnsMock.systemStub})
var dns = require('../index')


function init (cb) {
  require('../../../test/system/service1/service')(function (s1) {
    s1.inbound('*', dns(rdis, {portName: '_redis', name: 'redis', list: 's1'}))
    require('../../../test/system/service2/service')(function (s2) {
      s2.inbound('*', dns(rdis, {portName: '_redis', name: 'redis', list: 's2'}))
      cb(s1, s2)
    })
  })
}



test('consume services with redis transport test', function (t) {
  t.plan(1)

  process.env.DNS_NAMESPACE = 'testns'
  process.env.DNS_PORT = 53053
  process.env.DNS_HOST = '127.0.0.1'
  process.env.DNS_LOOKUP_INTERVAL = 60

  dnsMock.start(function () {
    setTimeout(function () {
      init(function (s1, s2) {
        var consumer = require('../../../test/system/consumer/consumer')()
        consumer.mu.outbound({role: 's1'}, dns(rdis, {portName: '_redis', name: 'redis', list: 's1'}))
        consumer.mu.outbound({role: 's2'}, dns(rdis, {portName: '_redis', name: 'redis', list: 's2'}))
        consumer.consume(function (err, result) {
          t.equal(err, null, 'check err is null')
          consumer.mu.tearDown()
          s1.tearDown()
          s2.tearDown()
          dnsMock.stop()
        })
      })
    }, 100)
  })
})

