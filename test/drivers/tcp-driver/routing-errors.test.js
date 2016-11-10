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
var createMu = require('../../../packages/mu')
var tcp = require('../../../packages/mu-tcp')
var NO_AVAILABLE_TRANSPORT = 'Routing error: no available response transport function'

var s1 = createMu()

function h1 (args, cb) {
  cb()
}

s1.define({role: 's1', cmd: 'one'}, h1)
s1.inbound({role: 's1'}, tcp.server({port: 3001, host: '127.0.0.1'}))

test('test no service', function (t) {
  t.plan(2)

  var mu = createMu()
  mu.outbound({role: 's1'}, tcp.client({port: 3001, host: '127.0.0.1'}))
  mu.dispatch({role: 's1', cmd: 'one'}, function (err, result) {
    t.equal(err, null)
    mu.dispatch({wibble: 'fish'}, function (err, result) {
      t.equal(err.message, NO_AVAILABLE_TRANSPORT)
      s1.tearDown()
      mu.tearDown()
    })
  })
})

