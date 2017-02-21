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
var http = require('../../../packages/mu-http')
var rcc = require('../../system/consumer/responseCountConsumer')(1)
var zrs = require('../../system/zeroResponseService/service')
var mrs = require('../../system/multiResponseService/service')

function initHttp (cb) {
  zrs(function (zero) {
    zero.inbound('*', http.server({port: 3001, host: '127.0.0.1'}))
    mrs(function (multi) {
      multi.inbound('*', http.server({port: 3002, host: '127.0.0.1'}))
      cb(zero, multi)
    })
  })
}

test('consume services expect two responses', function (t) {
  t.plan(1)
  var count = 0

  initHttp(function (zero, multi) {
    rcc.mu.outbound({role: 'multi'}, http.client({port: 3002, host: '127.0.0.1'}))
    rcc.consumeMulti(function (countResult) {
      count = countResult
    })
    setTimeout(function () {
      t.equal(count, 1, 'check service returns one response')
      multi.tearDown()
      zero.tearDown()
      rcc.mu.tearDown()
    }, 500)
  })
})
