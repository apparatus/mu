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

var mu_ = require('../lib/core')
var transport_ = require('../lib/transport')
var driver_ = require('./helpers/testTransportDriver')


test('local handler test', function (t) {
  t.plan(6)

  // service
  var mus = mu_()
  var musDriver = driver_()

  mus.define({role: 'test', cmd: 'one'}, function (args, cb) {
    t.deepEqual(args.pattern, { role: 'test', cmd: 'one', fish: 'cheese' })
    cb()
  })

  mus.define({role: 'test', cmd: 'two'}, function (args, cb) {
    t.deepEqual(args.pattern, { role: 'test', cmd: 'two', fish: 'cheese' })
    cb(null, {my: 'response'})
  })

  mus.define('*', transport_(mus, musDriver))


  // consumer
  var mu = mu_()
  var muDriver = driver_()

  mu.define('*', transport_(mu, muDriver))

  muDriver.setTarget(musDriver)
  musDriver.setTarget(muDriver)


  // execute
  mu.dispatch({role: 'test', cmd: 'one', fish: 'cheese'}, function (err, result) {
    t.equal(null, err)
    console.log(result)
    // t.equal(undefined, result)
  })


  /*
  mu.dispatch({role: 'test', cmd: 'two', fish: 'cheese'}, function (err, result) {
    t.equal(null, err)
    t.deepEqual({my: 'response'}, result)
  })
  */
})

