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

var FugeDns = require('fuge-dns')
var systemDns = require('dns')
var zone = {
  'A': {
    'service1.testns.svc.cluster.local': {
      'address': '127.0.0.1'
    },
    'service2.testns.svc.cluster.local': {
      'address': '127.0.0.1'
    },
    'redis.testns.svc.cluster.local': {
      'address': '127.0.0.1'
    }
  },
  'SRV': {
    '_tcp._tcp.service1.testns.svc.cluster.local': {
      'cname': 'service1.testns.svc.cluster.local',
      'port': '3001'
    },
    '_tcp._tcp.service2.testns.svc.cluster.local': {
      'cname': 'service2.testns.svc.cluster.local',
      'port': '3002'
    },
    '_redis._tcp.redis.testns.svc.cluster.local': {
      'cname': 'redis.testns.svc.cluster.local',
      'port': '6379'
    }
  }
}



module.exports = function () {
  var dns
  var errorA = false
  var errorSRV = false


  function start (cb) {
    dns = FugeDns({host: '127.0.0.1', port: 53053})
    dns.addZone(zone)
    dns.start(cb)
  }



  function stop (cb) {
    dns.stop(cb)
  }


  var systemStub = {
    resolveSrv: function (query, cb) {
      if (errorSRV) {
        return cb(null, [])
      }
      if (zone.SRV[query]) {
        cb(null, [{name: zone.SRV[query].cname, port: zone.SRV[query].port}])
      } else {
        cb(systemDns.NODATA)
      }
    },
    resolve4: function (query, cb) {
      if (errorA) {
        return cb('force error A')
      }
      if (zone.A[query]) {
        cb(null, [{address: zone.A[query].address}])
      } else {
        cb(systemDns.NODATA)
      }
    },
    NODATA: systemDns.NODATA
  }



  function setErrorA (e) { errorA = e }
  function setErrorSRV (e) { errorSRV = e }

  var dnsErrorSocketStub = function () {

    function query (q, port, host, cb) {
      var resp = { id: 14978,
                   type: 'response',
                   flags: 0,
                   questions:
                    [ { name: '_tcp._tcp.service2.testns.svc.cluster.local',
                        type: 'SRV',
                        class: 1 } ],
                   answers:
                    [ { name: '_tcp._tcp.service2.testns.svc.cluster.local',
                        type: 'SRV',
                        class: 1,
                        ttl: 5,
                        flush: false,
                        data: [Object] } ],
                   authorities: [],
                   additionals: [] }

      if (q.questions[0].type === 'SRV') {
        if (errorSRV) {
          return cb('force error on SRV')
        } else {
          cb(null, resp)
        }
      }

      if (q.questions[0].type === 'A') {
        if (errorA) {
          return cb('force error on A')
        }
      }
    }

    function destroy () {
    }

    return {
      query: query,
      destroy: destroy
    }
  }


  return {
    start: start,
    stop: stop,
    systemStub: systemStub,
    setErrorA: setErrorA,
    setErrorSRV: setErrorSRV,
    dnsErrorSocketStub: dnsErrorSocketStub
  }
}

