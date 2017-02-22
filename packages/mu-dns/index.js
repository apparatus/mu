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
var uuid = require('uuid')
var _ = require('lodash')
var concordant = require('concordant')
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
    var protocol
    var endpoints = []
    var lookupInterval = process.env.DNS_LOOKUP_INTERVAL || 60
    var extra
    var conc = concordant()

    assert(transport)
    assert(service)
    assert(service.portName && service.name)


    function init () {
      namespace = process.env.DNS_NAMESPACE || ''
      if (service.namespace) { namespace = service.namespace }

      suffix = process.env.DNS_SUFFIX || 'svc.cluster.local'
      if (service.suffix) { suffix = service.suffix }

      protocol = '_tcp'
      if (service.protocol) { protocol = service.protocol }

      query = service.portName + '.' + protocol + '.' + service.name
      if (namespace.length > 0) {
        query += '.' + namespace
      }
      query += '.' + suffix

      extra = _.omit(service, ['portName', 'name'])

      if (direction === 'inbound') {
        lookup(query, function () {})
      }
    }



    function createTransports (endpoints, cb) {
      endpoints.forEach(function (endpoint) {
        if (!endpoint.created) {
          if (direction === 'outbound') {
            endpoint.transport = transport.client(_.merge({port: endpoint.port, host: endpoint.host}, extra))(mu, {direction: direction, id: muid})
          } else {
            endpoint.transport = transport.server(_.merge({port: endpoint.port, host: endpoint.host}, extra))(mu, {direction: direction, id: muid})
          }
          endpoint.created = true
        }
      })
      cb()
    }



    function lookupRequired () {
      if (Date.now() - lastLookup > lookupInterval * 1000) {
        lastLookup = Date.now()
        return true
      }
      return false
    }



    function lookup (query, cb) {
      if (lookupRequired()) {
        conc.dns.resolve(query, function (err, results) {
          if (err) { return cb(err) }
          _.each(results, function (result) {
            if (!_.find(endpoints, function (endpoint) { return endpoint.host === result.host && endpoint.port === result.port })) {
              endpoints.push({port: result.port, host: result.host})
            }
          })
          createTransports(endpoints, cb)
        })
      } else {
        cb()
      }
    }



    function tf (message, cb) {
      lookup(query, function (err) {
        if (err) { return cb(mue.transport(err)) }

        endpoints[index] && endpoints[index].transport.tf(message, cb)
        index++
        if (index >= endpoints.length) {
          index = 0
        }
      })
    }



    function tearDown (cb) {
      var count = 0
      endpoints.forEach(function (endpoint) {
        endpoint.transport.tearDown(function () {
          ++count
          if (count === endpoints.length) {
            cb && cb()
          }
        })
      })
    }



    init()

    return {
      direction: direction,
      muid: muid,
      tf: tf,
      tearDown: tearDown,
      type: 'transport'
    }
  }
}

