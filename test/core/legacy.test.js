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

test('removed APIs with useful message', function (t) {
  t.throws(function () {
    require('../../packages/mu/drivers/func')
  }, 'mu/drivers/func does not exist, you want http://npm.im/mu-local')
  t.throws(function () {
    require('../../packages/mu/drivers/tcp')
  }, 'mu/drivers/tcp does not exist, you want http://npm.im/mu-tcp')
  t.throws(function () {
    require('../../packages/mu/drivers/redis')
  }, 'mu/drivers/redis does not exist, you want http://npm.im/mu-redis')
  t.throws(function () {
    require('../../packages/mu/adapters/tee')
  }, 'mu/adapters/tee does not exist, you want http://npm.im/mu-tee')
  t.throws(function () {
    require('../../packages/mu/adapters/balancer')
  }, 'mu/adapters/balancer does not exist, you want http://npm.im/mu-balancer')
  t.end()
})
