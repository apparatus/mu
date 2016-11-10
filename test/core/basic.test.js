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
var createMu = require('../../packages/mu')
var local = require('../../packages/mu-local')

test('local handler test', function (t) {
  t.plan(6)

  var mu = createMu({ logLevel: createMu.log.levelInfo })

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

  var mu = createMu()
  mu.inbound('*', local())

  mu.define({role: 'test', cmd: 'one'}, function (args, cb) {
    t.deepEqual(args.pattern, { role: 'test', cmd: 'one', fish: 'cheese' }, 'check pattern cmd one')
    cb()
  })

  mu.define({role: 'test', cmd: 'two'}, function (args, cb) {
    t.deepEqual(args.pattern, { role: 'test', cmd: 'two', fish: 'cheese' }, 'check pattern cms two')
    cb(null, {my: 'response'})
  })

  var routing = mu.print()
  t.notEqual(routing.indexOf('{"role":"test","cmd":"one"}'), -1)
  t.notEqual(routing.indexOf('{"role":"test","cmd":"two"}'), -1)
})

test('multi-dispatch same cb', function (t) {
  t.plan(18)

  var mu = createMu({ logLevel: createMu.log.levelInfo })
  var count = 0
  var total = 0
  mu.define({role: 'test', cmd: 'one'}, function (args, cb) {
    cb(null, {count: ++count, id: args.pattern.id})
  })

  function handler (err, result) {
    t.equal(null, err, 'check err is null')
    t.equal(result.count, ++total, 'check count is ' + total)
    t.equal(result.count, result.id, 'check count is ' + result.id)
  }

  mu.dispatch({role: 'test', cmd: 'one', id: 1}, handler)
  mu.dispatch({role: 'test', cmd: 'one', id: 2}, handler)
  mu.dispatch({role: 'test', cmd: 'one', id: 3}, handler)
  mu.dispatch({role: 'test', cmd: 'one', id: 4}, handler)
  mu.dispatch({role: 'test', cmd: 'one', id: 5}, handler)
  mu.dispatch({role: 'test', cmd: 'one', id: 6}, handler)
})

test('optional dispatch cb', function (t) {
  t.plan(2)

  var mu = createMu()

  mu.define({role: 'test', cmd: 'one'}, function (args, cb) {
    t.pass()
    cb()
  })

  t.doesNotThrow(function () {
    mu.dispatch({role: 'test', cmd: 'one'})
  })
})

test('tearDown cb', function (t) {
  t.plan(1)
  createMu().tearDown(function () {
    t.pass()
  })
})

test('bogus string route', function (t) {
  t.plan(1)
  var mu = createMu()

  t.doesNotThrow(function () {
    mu.define('test', function (args, cb) {
      t.fail()
      // nothing should happen here
    })
  })
})
