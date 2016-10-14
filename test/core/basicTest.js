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
var Mu = require('../../core/core')
var func = require('../../drivers/func')


test('local handler test', function (t) {
  t.plan(6)

  var mu = Mu({ logLevel: Mu.log.levelInfo })

  mu.define({role: 'test', cmd: 'one'}, function (args, cb) {
    t.deepEqual(args.pattern, { role: 'test', cmd: 'one', fish: 'cheese' }, 'check pattern cmd one')
    cb()
  })

  mu.define({role: 'test', cmd: 'two'}, function (args, cb) {
    t.deepEqual(args.pattern, { role: 'test', cmd: 'two', fish: 'cheese' }, 'check pattern cmd two')
    cb(null, {my: 'response'})
  })

  mu.dispatch({role: 'test', cmd: 'one', fish: 'cheese'}, function (err, result) {
    t.equal(null, err, 'check err is null')
    t.deepEqual({}, result, 'check result is empty')
  })

  mu.dispatch({role: 'test', cmd: 'two', fish: 'cheese'}, function (err, result) {
    t.equal(null, err, 'check err is null')
    t.deepEqual({my: 'response'}, result, 'check result')
  })
})



test('route print test', function (t) {
  t.plan(2)

  var mu = Mu()
  mu.inbound('*', func())

  mu.define({role: 'test', cmd: 'one'}, function (args, cb) {
    t.deepEqual(args.pattern, { role: 'test', cmd: 'one', fish: 'cheese' }, 'check pattern cmd one')
    cb()
  })

  mu.define({role: 'test', cmd: 'two'}, function (args, cb) {
    t.deepEqual(args.pattern, { role: 'test', cmd: 'two', fish: 'cheese' }, 'check pattern cms two')
    cb(null, {my: 'response'})
  })

  var routing = mu.print()
  t.notEqual(routing.indexOf('{"cmd":"one","role":"test"}'), -1)
  t.notEqual(routing.indexOf('{"cmd":"two","role":"test"}'), -1)
})

