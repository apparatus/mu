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
var createMu = require('../../../packages/mu')
var service1 = require('../../system/service1/service')

function init (cb) {
  service1(function (s1) {
    s1.inbound('*', tcp.server({port: 3001, host: '127.0.0.1'}))
    var router = createMu()
    router.inbound('*', tcp.server({port: 3003, host: '127.0.0.1'}))
    router.outbound({role: 's1'}, tcp.client({port: 3001, host: '127.0.0.1'}))
    cb(s1, router)
  })
}

// TODO: also add test {role: 's2'} should fail no outbound route

test('consume services with tcp transport test', function (t) {
  t.plan(2)

  init(function (s1, router) {
    var client = createMu()
    client.outbound({role: 's1'}, tcp.client({port: 3003, host: '127.0.0.1'}))
    client.dispatch({role: 's1', cmd: 'two'}, function (err, result) {
      t.equal(null, err)
      t.deepEqual({my: 'response'}, result)
      client.tearDown()
      s1.tearDown()
      router.tearDown()
    })
  })
})

