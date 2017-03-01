# mu-transport

The official dns service discovery adapter for mu

[![npm][npm-badge]][npm-url]
[![travis][travis-badge]][travis-url]
[![coveralls][coveralls-badge]][coveralls-url]
[![david][david-badge]][david-url]

- __Sponsor:__ [nearForm][sponsor]
- __Status:__ Experimental

Part of the Official [mu][Mu Suite].

`mu-dns` is the dns service discovery adapter for [mu][`mu`].


* [Install](#install)
* [API](#api)
* [License](#license)


## Install

```sh
$ npm install mu-dns
```

## Purpose
The mu-dns adapter performs DNS lookups either directly against a nominated DNS server or using the system resolver mechanism. It is intended for use in container based deployments for example with Kubernetes or with the `fuge` development tool.

## Operation

### Lookup sequence
Mu-dns resolves services as follows:

* Perform an SRV query to determine service port number and canonical name
* Then perform an A query against the canonical name to determine one or more ip addresses

### mode
Mu-dns operates in one of two modes, direct or system depending on the environment configuration.

* if `DNS_HOST` variable is present in the environment then a direct lookup is performed in this case
  * Use `DNS_HOST` and `DNS_PORT` to connect directly to a DNS server. If `DNS_PORT` is not set default to 53053 as the port number
* if `DNS_HOST` is not present then use the system based resolver for queries

### Query formation
Mu-dns forms SRV queries as follows:

```
_<port name>._<protocol name>.<service name>.<namespace>.<suffix>
```

The query is constructed as follows:

* `<port name>` must be supplied
* `<protocol name>` may be supplied, defaults to '_tcp'
* `<service name>` must be supplied
* `<namespace>` may be supplied, otherwise the `DNS_NAMESPACE` variable is used if supplied, otherwise defaults to 'default'
* `<suffix>` may be supplied, otherwise the `DNS_SUFFIX` variable is used if supplied, otherwise defaults to 'svc.cluster.local'


## Examples

```javascript
var mu = require('mu')()
var tcp = require('mu-tcp')
var dns = require('mu-dns')

mu.outbound({role: 'basic'}, dns(tcp, {name: 'my_service', portName: '_main'}))
```

In the above example service name and portName are supplied, this will result in SRV query: '_main._tcp.my_service.default.svc.cluster.local'


## License
Copyright Peter Elger 2016 & Contributors, Licensed under [MIT][].


[mu]: https://github.com/apparatus/mu
[travis-badge]: https://travis-ci.org/apparatus/mu.svg?branch=master
[travis-url]: https://travis-ci.org/apparatus/mu
[npm-badge]: https://badge.fury.io/js/mu.svg
[npm-url]: https://npmjs.org/package/mu
[logo-url]: https://raw.githubusercontent.com/apparatus/mu/master/assets/mu.png
[coveralls-badge]: https://coveralls.io/repos/apparatus/mu/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/apparatus/mu?branch=master
[david-badge]: https://david-dm.org/apparatus/mu.svg
[david-url]: https://david-dm.org/apparatus/mu?path=packages/mu-transport
[sponsor]: http://nearform.com
[MIT]: ./LICENSE
