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
var tcp = require('../../../drivers/tcp')
var mu = require('../../../core/core')()
var service1 = require('../../system/service1/service')
var service2 = require('../../system/service2/service')
var service3 = require('../../system/service3/service')

function init (cb) {
  service1(function (s1) {
    s1.inbound('*', tcp.server({port: 3001, host: '127.0.0.1'}))
    service2(function (s2) {
      s2.inbound('*', tcp.server({port: 3002, host: '127.0.0.1'}))
      service3(function (s3) {
        s3.inbound('*', tcp.server({port: 3003, host: '127.0.0.1'}))
        s3.outbound({role: 's1'}, tcp.client({port: 3001, host: '127.0.0.1'}))
        cb(s1, s2, s3)
      })
    })
  })
}

test('consume services with tcp transport test', function (t) {
  t.plan(2)

  init(function (s1, s2, s3) {
    mu.outbound({role: 's1'}, tcp.client({port: 3001, host: '127.0.0.1'}))
    mu.outbound({role: 's2'}, tcp.client({port: 3002, host: '127.0.0.1'}))
    mu.outbound({role: 's3'}, tcp.client({port: 3003, host: '127.0.0.1'}))
    mu.dispatch({role: 's3', cmd: 'one'}, function (err, result) {
      t.equal(null, err)
      t.deepEqual({my: 'response'}, result)
      mu.tearDown()
      s1.tearDown()
      s2.tearDown()
      s3.tearDown()
    })
  })
})

