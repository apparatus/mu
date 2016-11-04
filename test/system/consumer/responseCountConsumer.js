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

var mu = require('../../../core/core')()

module.exports = function () {
  function consumeZero (cb) {
    mu.dispatch({role: 'zero', cmd: 'one'}, function () {
      cb(false)
    })
    setTimeout(function () {
      cb(true)
    }, 1000)
  }

  function consumeMulti (cb) {
    var count = 0
    mu.dispatch({role: 'multi', cmd: 'one'}, function () {
      count = count + 1
      if (count === 2) {
        cb(count)
      }
    })
  }

  return {
    mu: mu,
    consumeZero: consumeZero,
    consumeMulti: consumeMulti
  }
}

