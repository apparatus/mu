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


exports.levelTrace = 1
exports.levelDebug = 2
exports.levelInfo = 3
exports.levelWarn = 4
exports.levelError = 5
exports.levelFatal = 6

exports.create = function (l) {
  var level = l || exports.levelInfo


  function log (targetLevel, message) {
    if (targetLevel >= level) {
      console.log(message)
    }
  }



  function applyLog (targetLevel) {
    return function (message) {
      log(targetLevel, message)
    }
  }



  function setLevel (l) {
    level = l
  }



  return {
    setLevel: setLevel,
    trace: applyLog(exports.levelTrace),
    debug: applyLog(exports.levelDebug),
    info: applyLog(exports.levelInfo),
    warn: applyLog(exports.levelWarn),
    error: applyLog(exports.levelError),
    fatal: applyLog(exports.levelFatal)
  }
}

