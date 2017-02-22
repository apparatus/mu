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
var mu = require('../../mu')()
var tcp = require('../../mu-tcp')
var proxyquire = require('proxyquire')
var dnsMock = require('./support/dns.stub.js')()
var service1 = require('../../../test/system/service1/service')
proxyquire('concordant/dnsResolver', {dns: dnsMock.systemStub, 'dns-socket': dnsMock.dnsErrorSocketStub})
var dns = require('../index')

function initS1 (cb) {
  service1(function (s1) {
    s1.inbound('*', tcp.server({port: 3001, host: '127.0.0.1'}))
    cb(s1)
  })
}


test('test error lookup with system dns', function (t) {
  t.plan(2)

  process.env.DNS_LOOKUP_INTERVAL = 60

  initS1(function (s1) {
    dnsMock.setErrorSRV(true)
    dnsMock.setErrorA(false)

    mu.outbound({role: 's1'}, dns(tcp, {portName: '_tcp', protocol: '_tcp', name: 'service1'}))
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


test('test error lookup with system dns', function (t) {
  t.plan(2)

  process.env.DNS_NAMESPACE = 'testns'
  process.env.DNS_LOOKUP_INTERVAL = 60

  initS1(function (s1) {
    dnsMock.setErrorSRV(true)
    dnsMock.setErrorA(false)

    mu.outbound({role: 's1'}, dns(tcp, {portName: '_tcp', protocol: '_tcp', name: 'service1'}))
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


test('test error lookup with system dns', function (t) {
  t.plan(2)

  process.env.DNS_NAMESPACE = 'testns'
  process.env.DNS_LOOKUP_INTERVAL = 60

  initS1(function (s1) {
    dnsMock.setErrorSRV(false)
    dnsMock.setErrorA(true)

    mu.outbound({role: 's1'}, dns(tcp, {portName: '_tcp', protocol: '_tcp', name: 'service1'}))
    mu.dispatch({role: 's1', cmd: 'two', fish: 'cheese'}, function (err, result) {
      setTimeout(function () {
        t.notequal(null, err, 'test error condition on bad lookup')
        t.equal(err.output.mu.message, 'force error A', 'test that error is no data from dns')
        mu.tearDown()
        s1.tearDown()
      }, 100)
    })
  })
})



test('test error on lookup with development dns SRV', function (t) {
  t.plan(2)

  process.env.DNS_NAMESPACE = 'testns'
  process.env.DNS_PORT = 53053
  process.env.DNS_HOST = '127.0.0.1'

  initS1(function (s1) {
    mu.outbound({role: 's1'}, dns(tcp, {portName: '_tcp', protocol: '_tcp', name: 'service1'}))

    dnsMock.setErrorSRV(true)
    mu.dispatch({role: 's1', cmd: 'two', fish: 'cheese'}, function (err, result) {
      setTimeout(function () {
        t.notequal(null, err, 'test error condition on bad lookup')
        t.equal(err.output.mu.message, 'force error on SRV', 'test that error is no data from dns')
        mu.tearDown()
        s1.tearDown()
      }, 100)
    })
  })
})


test('test error on lookup with development dns A', function (t) {
  t.plan(2)

  process.env.DNS_NAMESPACE = 'testns'
  process.env.DNS_PORT = 53053
  process.env.DNS_HOST = '127.0.0.1'

  initS1(function (s1) {
    mu.outbound({role: 's1'}, dns(tcp, {portName: '_tcp', protocol: '_tcp', name: 'service1'}))

    dnsMock.setErrorSRV(false)
    dnsMock.setErrorA(true)
    mu.dispatch({role: 's1', cmd: 'two', fish: 'cheese'}, function (err, result) {
      setTimeout(function () {
        t.notequal(null, err, 'test error condition on bad lookup')
        t.equal(err.output.mu.message, 'force error on A', 'test that error is no transports available')
        mu.tearDown()
        s1.tearDown()
      }, 100)
    })
  })
})

