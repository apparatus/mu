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
var mu = require('../../../packages/mu')()
var local = require('../../../packages/mu-local')
var service1 = require('../../system/service1/service')

var driver = require('../../../packages/mu-local/driver')
driver.forceError()

function init (cb) {
  service1(function (s1) {
    s1.inbound('*', local())
    cb(s1)
  })
}

test('test forced error on response', function (t) {
  t.plan(1)

  init(function (s1) {
    mu.outbound({role: 's1'}, local({target: s1}))
    mu.dispatch({role: 's1', cmd: 'two', fish: 'cheese'}, function (err, result) {
      s1.tearDown()
      mu.tearDown()
    })
    setTimeout(function () {
      s1.tearDown()
      mu.tearDown()
      t.pass()
    }, 200)
  })
})

