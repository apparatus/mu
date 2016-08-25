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
var driver_ = require('../driver')

var msg = { pattern: {role: 'test', cmd: 'test'}, protocol: { path: [], trace: [], ttl: 10, dst: 'target', src: 'c7066bfd-96d6-4be4-98eb-49574ede2ccc' } }


test('send recieve test', function (t) {
  t.plan(4)

  var server = driver_({source: {port: 3001, host: '127.0.0.1'}})
  var client = driver_({target: {port: 3001, host: '127.0.0.1'}})


  server.receive(function (err, message) {
    t.equal(null, err)
    console.log('server got message')
    t.equal(1, 1)
    message.protocol.dst = message.protocol.src
    server.send(message)
  })

  client.receive(function (err, message) {
    t.equal(null, err)
    console.log('client got message')
    t.equal(1, 1)
    client.tearDown()
    server.tearDown()
  })

  client.send(msg)
})

