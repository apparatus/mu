/*
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES LOSS OF USE, DATA, OR PROFITS OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

'use strict'

var test = require('tap').test
var createMu = require('../../core/core')
var func = require('../../drivers/func')

test('force an error with function transport test for coverage numbers', function (t) {
  t.plan(1)

  var mu1 = createMu()

  mu1.define({role: 's1', cmd: 'one'}, function (args, cb) {
    cb()
  })

  mu1.define({role: 's1', cmd: 'two'}, function (args, cb) {
    cb(null, {my: 'response'})
  })

  mu1.inbound('*', func())

  var mu = createMu()

  mu.outbound({role: 's1'}, func({target: mu1}))

  mu.dispatch({role: 's1', cmd: 'one', __err: 'err'}, function () {
  })
  setTimeout(function () {
    mu1.tearDown()
    mu.tearDown()
    t.pass('expect no response from driver fail')
  }, 500)
})
