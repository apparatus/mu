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

var register = {}


/**
 * local function transport. uses a global function transport registry to connect in process mu instances
 */
module.exports = function (options) {
  var instance
  var recieveCb
  var target = null



  function receive (cb) {
    recieveCb = cb
  }



  function send (message, cb) {
    if (message.protocol.dst === 'target') {
      target.call(message)
    }
    else {
      register[message.protocol.dst].call(message)
    }
  }



  function tearDown () {
  }



  function call (message) {
    if (message && message.pattern && message.pattern.__err) {
      recieveCb(message.pattern.__err, message)
    }
    else {
      recieveCb(null, message)
    }
  }



  function setId (id) {
    register[id] = instance
  }



  instance = {
    type: 'func',
    send: send,
    receive: receive,
    tearDown: tearDown,
    setId: setId,
    call: call,
    recieveCb: recieveCb
  }

  if (options && options.target) {
    options.target.transportList().forEach(function (transport) {
      if (transport.driver && transport.driver.type === 'func') {
        target = register[transport.muid]
      }
    })
  }

  return instance
}

