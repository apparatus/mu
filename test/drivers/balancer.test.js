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
var balance = require('../../adapters/balance')
var service = require('./system/service1/service')

function init (cb) {
  service(function (s1) {
    s1.inbound('*', tcp.server({port: 3001, host: '127.0.0.1'}))
    service(function (s2) {
      s2.inbound('*', tcp.server({port: 3002, host: '127.0.0.1'}))
      cb(s1, s2)
    })
  })
}

test('consume services with tcp balancer adapter', function (t) {
  t.plan(2)

  init(function (s1, s2) {
    mu.outbound({role: 's1'}, balance([tcp.client({port: 3001, host: '127.0.0.1'}),
                                       tcp.client({port: 3002, host: '127.0.0.1'})]))
    mu.dispatch({role: 's1', cmd: 'two', fish: 'cheese'}, function (err, result) {
      t.equal(null, err)
      mu.dispatch({role: 's1', cmd: 'two', fish: 'cheese'}, function (err, result) {
        t.equal(null, err)
        mu.tearDown()
        s1.tearDown()
        s2.tearDown()
      })
    })
  })
})

