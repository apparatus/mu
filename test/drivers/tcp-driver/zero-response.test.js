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
var rcc = require('../../system/consumer/responseCountConsumer')()
var zrs = require('../../system/zeroResponseService/service')

function initTcp (cb) {
  zrs(function (zero) {
    zero.inbound('*', tcp.server({port: 3001, host: '127.0.0.1'}))
    require('../../system/multiResponseService/service')(function (multi) {
      multi.inbound('*', tcp.server({port: 3002, host: '127.0.0.1'}))
      cb(zero, multi)
    })
  })
}

test('consume services expect no response', function (t) {
  t.plan(1)

  initTcp(function (zero, multi) {
    rcc.mu.outbound({role: 'zero'}, tcp.client({port: 3001, host: '127.0.0.1'}))
    rcc.consumeZero(function (result) {
      t.equal(true, result)
      multi.tearDown()
      zero.tearDown()
      rcc.mu.tearDown()
    })
  })
})

