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
var mu = require('../../core/core')()
var tcp = require('../../drivers/tcp')



function init (cb) {
  require('./system/errorService/service')(function (errSvc) {
    errSvc.inbound('*', tcp.server({port: 3001, host: '127.0.0.1'}))
    cb(errSvc)
  })
}

/*
 * to simulate:
 * send error - simulate this with an error driver
 * service returns in bound error (in protocol) - simulate with a tcp servce
 * service crashes and restarts - simulate with a tcp service
 * service locks up (i.e. no response) (make it simple to add a service timeout on a per call basis ? or is this external to mu) simulate with a tcp service
 *
 * work in this -> also need to update other tests with correct response,
 * the protocol block should not be passed back to the calling code, however may need some mechanism to
 * make this available for debugging...
 *
 * test this will a single instace dispatch also
 */



test('service returning inbound error', function (t) {
  t.plan(1)

  init(function (errSvc) {
    mu.outbound('*', tcp.client({port: 3001, host: '127.0.0.1'}))
    mu.dispatch({role: 'error', cmd: 'error'}, function (err, result) {
      t.equal(err, 'oh fek')
      errSvc.tearDown()
      mu.tearDown()
    })
  })
})

// crash test - will need to spin up separate process here and send the message
