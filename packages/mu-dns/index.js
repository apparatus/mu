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

var assert = require('assert')
var _ = require('lodash')
var uuid = require('uuid')
var async = require('async')
var dns = require('dns')
var dnsSocket = require('dns-socket')
var mue = require('mu-error')()



/**
 * dns based service discovery for mu
 */
module.exports = function muDns (transport, service) {
  return function adapter (mu, opts) {
    assert(opts)

    var index = 0
    var direction = opts.direction
    var muid = opts.id || uuid()
    var lastLookup = 0
    var namespace
    var suffix
    var query
    var endpoints = []
    var modeSystem = !process.env.DNS_HOST
    var lookupInterval = process.env.DNS_LOOKUP_INTERVAL || 60

    assert(transport)
    assert(service)
    assert(service.portName && service.protocol && service.name)



    function init () {
      namespace = process.env.DNS_NAMESPACE || ''
      if (service.namespace) { namespace = service.namespace }

      suffix = process.env.DNS_SUFFIX || 'svc.cluster.local'
      if (service.suffix) { suffix = service.suffix }

      query = service.portName + '.' + service.protocol + '.' + service.name
      if (namespace.length > 0) {
        query += '.' + namespace
      }
      query += '.' + suffix
    }



    function createTransports (endpoints, cb) {
      endpoints.forEach(function (endpoint) {
        if (!endpoint.created) {
          endpoint.transport = transport.client({port: endpoint.port, host: endpoint.host})(mu, {direction: direction, id: muid})
          endpoint.created = true
        }
      })
      cb()
    }



    /**
     * resolve the service endpoint(s) using a specific dns host and port provided through environment variables
     * DNS_HOST and DNS_PORT
     */
    function lookupDirect (cb) {
      var client = dnsSocket()

      client.query({questions: [{type: 'SRV', name: query}]}, process.env.DNS_PORT, process.env.DNS_HOST, function (err, serviceSRV) {
        if (err) { return cb(err) }

        if (serviceSRV.answers && serviceSRV.answers.length > 0) {
          async.eachSeries(serviceSRV.answers, function (answer, next) {

            client.query({questions: [{type: 'A', name: answer.data.target}]}, process.env.DNS_PORT, process.env.DNS_HOST, function (err, serviceA) {
              if (err) { return next(err) }

              if (serviceA.answers && serviceA.answers.length > 0) {
                if (!_.find(endpoints, function (endpoint) { return endpoint.host === serviceA.answers[0].data && endpoint.port === answer.data.port })) {
                  endpoints.push({port: answer.data.port, host: serviceA.answers[0].data})
                }
              }
              next()
            })
          }, function (err) {
            if (err) { return cb(err) }
            client.destroy()
            createTransports(endpoints, cb)
          })
        } else {
          client.destroy()
          cb()
        }
      })
    }



    /**
     * resolve the service endpoint(s) using standard system provided lookup mechanism (e.g. /etc/resolv.cong)
     */
    function lookupSystem (cb) {
      dns.resolveSrv(query, function (err, addressesSRV) {
        if (err) { return cb(err) }
        if (addressesSRV && addressesSRV.length > 0) {
          async.eachSeries(addressesSRV, function (addressSRV, next) {
            dns.resolve4(addressSRV.name, function (err, addressesA) {
              if (err) { return next(err) }
              if (addressesA && addressesA.length > 0) {
                if (!_.find(endpoints, function (endpoint) { return endpoint.host === addressesA[0].address && endpoint.port === addressSRV.port })) {
                  endpoints.push({port: addressSRV.port, host: addressesA[0].address})
                }
              }
              next()
            })
          }, function (err) {
            if (err) { return cb(err) }
            createTransports(endpoints, cb)
          })
        } else {
          cb(dns.NODATA)
        }
      })
    }



    function lookupRequired () {
      if (Date.now() - lastLookup > lookupInterval * 1000) {
        lastLookup = Date.now()
        return true
      }
      return false
    }



    function lookup (cb) {
      if (lookupRequired()) {
        if (modeSystem) {
          lookupSystem(cb)
        } else {
          lookupDirect(cb)
        }
      } else {
        cb()
      }
    }



    function tf (message, cb) {
      lookup(function (err) {
        if (err) { return cb(mue.transport(err)) }

        if (endpoints.length > 0) {
          endpoints[index].transport.tf(message, cb)
          index++
          if (index >= endpoints.length) {
            index = 0
          }
        } else {
          cb(mue.transport('mu-dns, no transports available'))
        }
      })
    }


    init()

    return {
      direction: direction,
      muid: muid,
      tf: tf,
      type: 'transport'
    }
  }
}

