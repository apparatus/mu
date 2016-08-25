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

var test = require('tape')
var mu = require('../lib/core')()


test('local handler test', function (t) {
  t.plan(6)

  mu.define({role: 'test', cmd: 'one'}, function (args, cb) {
    t.deepEqual(args.pattern, { role: 'test', cmd: 'one', fish: 'cheese' })
    cb()
  })

  mu.define({role: 'test', cmd: 'two'}, function (args, cb) {
    t.deepEqual(args.pattern, { role: 'test', cmd: 'two', fish: 'cheese' })
    cb(null, {my: 'response'})
  })

  mu.dispatch({role: 'test', cmd: 'one', fish: 'cheese'}, function (err, result) {
    t.equal(undefined, err)
    t.equal(undefined, result)
  })

  mu.dispatch({role: 'test', cmd: 'two', fish: 'cheese'}, function (err, result) {
    t.equal(null, err)
    t.deepEqual({my: 'response'}, result)
  })
})


test('route print test', function (t) {
  t.plan(1)
  var result = `patterns:
{"cmd":"one","role":"test"} -> handler
{"cmd":"two","role":"test"} -> handler
`

  mu.define({role: 'test', cmd: 'one'}, function (args, cb) {
    t.deepEqual(args.pattern, { role: 'test', cmd: 'one', fish: 'cheese' })
    cb()
  })

  mu.define({role: 'test', cmd: 'two'}, function (args, cb) {
    t.deepEqual(args.pattern, { role: 'test', cmd: 'two', fish: 'cheese' })
    cb(null, {my: 'response'})
  })

  t.equal(mu.print(), result)
})

