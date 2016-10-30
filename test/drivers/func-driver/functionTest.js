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
var func = require('../../../drivers/func')
var service1 = require('../../system/service1/service')
var service2 = require('../../system/service2/service')
var createConsumer = require('../../system/consumer/consumer')

function init (cb) {
  service1(function (s1) {
    s1.inbound('*', func())
    service2(function (s2) {
      s2.inbound('*', func())
      cb(s1, s2)
    })
  })
}

test('consume services with function transport test', function (t) {
  t.plan(2)

  init(function (s1, s2) {
    var consumer = createConsumer()
    consumer.mu.outbound({role: 's1'}, func({target: s1}))
    consumer.mu.outbound({role: 's2'}, func({target: s2}))

    consumer.consume(function (err, result) {
      t.equal(err, null, 'check err is null')
      t.deepEqual(result, {my: 'response'}, 'check result')
      consumer.mu.tearDown()
      s1.tearDown()
      s2.tearDown()
    })
  })
})

