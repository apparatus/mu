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
var mu = require('../../packages/mu')()
var tcp = require('../../packages/mu-tcp')
var proxyquire = require('proxyquire')

var dnsMock = require('./support/dns.stub.js')()
var service1 = require('../system/service1/service')
var service2 = require('../system/service2/service')

var dns = proxyquire('../../packages/mu-dns', {dns: dnsMock.systemStub})


function init (cb) {
  service1(function (s1) {
    s1.inbound('*', tcp.server({port: 3001, host: '127.0.0.1'}))
    service2(function (s2) {
      s2.inbound('*', tcp.server({port: 3002, host: '127.0.0.1'}))
      cb(s1, s2)
    })
  })
}



function initS1 (cb) {
  service1(function (s1) {
    s1.inbound('*', tcp.server({port: 3001, host: '127.0.0.1'}))
    cb(s1)
  })
}


test('consume services with system dns lookup', function (t) {
  t.plan(3)

  process.env.DNS_NAMESPACE = 'testns'

  init(function (s1, s2) {
    mu.outbound({role: 's1'}, dns(tcp, {portName: '_tcp', protocol: '_tcp', name: 'service1'}))
    mu.outbound({role: 's2'}, dns(tcp, {portName: '_tcp', protocol: '_tcp', name: 'service2'}))
    mu.dispatch({role: 's1', cmd: 'two', fish: 'cheese'}, function (err, result) {
      t.equal(null, err, 'test no error on lookup and consume service1')
      mu.dispatch({role: 's2', cmd: 'two', fish: 'cheese'}, function (err, result) {
        t.equal(null, err, 'test no error on lookup and consume service2')
        mu.dispatch({role: 's2', cmd: 'two', fish: 'cheese'}, function (err, result) {
          t.equal(null, err, 'test no error on lookup and consume service2')
          mu.tearDown()
          s1.tearDown()
          s2.tearDown()
        })
      })
    })
  })
})



test('consume services with system dns lookup adjusting lookup interval', function (t) {
  t.plan(3)

  process.env.DNS_NAMESPACE = 'testns'
  process.env.DNS_LOOKUP_INTERVAL = 0

  setTimeout(function () {
    init(function (s1, s2) {
      mu.outbound({role: 's1'}, dns(tcp, {portName: '_tcp', protocol: '_tcp', name: 'service1'}))
      mu.outbound({role: 's2'}, dns(tcp, {portName: '_tcp', protocol: '_tcp', name: 'service2', namespace: 'testns', suffix: 'svc.cluster.local'}))
      mu.dispatch({role: 's1', cmd: 'two', fish: 'cheese'}, function (err, result) {
        t.equal(null, err, 'test no error on lookup and consume service1')
        mu.dispatch({role: 's2', cmd: 'two', fish: 'cheese'}, function (err, result) {
          t.equal(null, err, 'test no error on lookup and consume service2')
          mu.dispatch({role: 's2', cmd: 'two', fish: 'cheese'}, function (err, result) {
            t.equal(null, err, 'test no error on lookup and consume service2')
            mu.tearDown()
            s1.tearDown()
            s2.tearDown()
          })
        })
      })
    })
  }, 100)
})



test('test fail lookup with system dns', function (t) {
  t.plan(2)

  process.env.DNS_NAMESPACE = 'testns'
  process.env.DNS_LOOKUP_INTERVAL = 60

  initS1(function (s1) {
    mu.outbound({role: 's1'}, dns(tcp, {portName: '_tcp', protocol: '_tcp', name: 'wibble'}))
    mu.dispatch({role: 's1', cmd: 'two', fish: 'cheese'}, function (err, result) {
      setTimeout(function () {
        t.notequal(null, err, 'test error condition on bad lookup')
        t.equal(err.output.mu.message, 'ENODATA', 'test that error is no data from dns')
        mu.tearDown()
        s1.tearDown()
      }, 100)
    })
  })
})



test('consume services with development dns server', function (t) {
  t.plan(3)

  process.env.DNS_NAMESPACE = 'testns'
  process.env.DNS_PORT = 53053
  process.env.DNS_HOST = '127.0.0.1'
  process.env.DNS_LOOKUP_INTERVAL = 60

  dnsMock.start(function () {
    init(function (s1, s2) {
      mu.outbound({role: 's1'}, dns(tcp, {portName: '_tcp', protocol: '_tcp', name: 'service1'}))
      mu.outbound({role: 's2'}, dns(tcp, {portName: '_tcp', protocol: '_tcp', name: 'service2'}))
      mu.dispatch({role: 's1', cmd: 'two', fish: 'cheese'}, function (err, result) {
        t.equal(null, err, 'test no error on lookup and consume service1')
        mu.dispatch({role: 's2', cmd: 'two', fish: 'cheese'}, function (err, result) {
          t.equal(null, err, 'test no error on lookup and consume service2')
          mu.dispatch({role: 's2', cmd: 'two', fish: 'cheese'}, function (err, result) {
            t.equal(null, err, 'test no error on lookup and consume service2')
            mu.tearDown()
            s1.tearDown()
            s2.tearDown()
            dnsMock.stop()
          })
        })
      })
    })
  })
})



test('consume services with development dns server adjusting lookup interval', function (t) {
  t.plan(3)

  process.env.DNS_NAMESPACE = 'testns'
  process.env.DNS_PORT = 53053
  process.env.DNS_HOST = '127.0.0.1'
  process.env.DNS_LOOKUP_INTERVAL = 0

  setTimeout(function () {
    dnsMock.start(function () {
      init(function (s1, s2) {
        mu.outbound({role: 's1'}, dns(tcp, {portName: '_tcp', protocol: '_tcp', name: 'service1'}))
        mu.outbound({role: 's2'}, dns(tcp, {portName: '_tcp', protocol: '_tcp', name: 'service2'}))
        mu.dispatch({role: 's1', cmd: 'two', fish: 'cheese'}, function (err, result) {
          t.equal(null, err, 'test no error on lookup and consume service1')
          mu.dispatch({role: 's2', cmd: 'two', fish: 'cheese'}, function (err, result) {
            t.equal(null, err, 'test no error on lookup and consume service2')
            mu.dispatch({role: 's2', cmd: 'two', fish: 'cheese'}, function (err, result) {
              t.equal(null, err, 'test no error on lookup and consume service2')
              mu.tearDown()
              s1.tearDown()
              s2.tearDown()
              dnsMock.stop()
            })
          })
        })
      })
    })
  }, 100)
})



test('test fail lookup with development dns', function (t) {
  t.plan(2)

  process.env.DNS_NAMESPACE = 'testns'
  process.env.DNS_PORT = 53053
  process.env.DNS_HOST = '127.0.0.1'
  process.env.DNS_LOOKUP_INTERVAL = 60

  setTimeout(function () {
    dnsMock.start(function () {
      initS1(function (s1) {
        mu.outbound({role: 's1'}, dns(tcp, {portName: '_tcp', protocol: '_tcp', name: 'wibble'}))
        mu.dispatch({role: 's1', cmd: 'two', fish: 'cheese'}, function (err, result) {
          setTimeout(function () {
            t.notequal(null, err, 'test error condition on bad lookup')
            t.equal(err.output.mu.message, 'mu-dns, no transports available', 'test that error is no transports available')
            mu.tearDown()
            s1.tearDown()
            dnsMock.stop()
          }, 100)
        })
      })
    })
  }, 100)
})

