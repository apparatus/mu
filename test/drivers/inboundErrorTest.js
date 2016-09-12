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

var test = require('tape')
var tcp = require('../../drivers/tcp')



function init (cb) {
  require('./system/errorService/service')(function (s1) {
    s1.inbound('*', tcp.server({port: 3001, host: '127.0.0.1'}))
    cb(s1)
  })
}



test('consume services returning inbounds error', function (t) {
  t.plan(1)

  init(function (s1, s2) {
    var consumer = require('./system/consumer/')()
    consumer.mu.outbound({role: 's1'}, tcp.client({port: 3001, host: '127.0.0.1'}))
    consumer.mu.outbound({role: 's2'}, tcp.client({port: 3002, host: '127.0.0.1'}))
    consumer.consume(function (err, result) {
      t.equal(err, null)
      consumer.mu.tearDown()
      s1.tearDown()
      s2.tearDown()
    })
  })
})


