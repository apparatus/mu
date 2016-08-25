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

var funcDriver = require('./drivers/function-driver/driver.js')
var tcpDriver = require('./drivers/tcp-driver/driver.js')
var balanceAdapter = require('./adapters/balance')
var teeAdapter = require('./adapters/tee')


module.exports = function (mu, transport) {
  function func (options) { return transport(mu, funcDriver(mu, options)) }
  function tcp (options) { return transport(mu, tcpDriver(mu.log, options)) }
  function balance (transports) { return balanceAdapter(mu, transports) }
  function tee (transports) { return teeAdapter(mu, transports) }


  return {
    func: func,
    tcp: tcp,
    balance: balance,
    tee: tee
  }
}

