# mu

[![npm][npm-badge]][npm-url]
[![travis][travis-badge]][travis-url]
[![coveralls][coveralls-badge]][coveralls-url]

- __Sponsor:__ [nearForm][sponsor]
- __Status:__ Experimental

Mu is a message based router for building distributed systems. It allows messages to be routed and
handled across various transports. Mu is aggressively light weight to ensure ease of use and speed
of execution.

* [Install](#install)
* [API](#api)
* [Development](#development)
* [License](#license)


## Install
To install mu, simply use npm,

```sh
$ npm install mu
```

## Example

`service-a.js`:

```js
const mu = require('mu')({dev: process.NODE_ENV !== 'production'})
const tcp = require('mu-tcp')

// define routing:

mu.inbound({role: 'some'}, tcp.server({port: 3000, host: '127.0.0.1'}))

// define patterns:

mu.define({role: 'some', cmd: 'thing'}, function (args, cb) {
  if (!args.pattern.user) {
    return cb(mu.error('no user found!'))
  }
  cb(null, {some: 'data'})
})
```

`service-b.js`:

```js
const mu = require('mu')({dev: process.NODE_ENV !== 'production'})
const tcp = require('mu-tcp')

// define routing:

mu.outbound({role: 'some'}, tcp.client({port: 3000, host: '127.0.0.1'}))

// define patterns:

mu.dispatch({role: 'some', cmd: 'thing', user: 'me :)'}, function (err, result) {
  if (err) {
    return console.error(err)
  }
  console.log(result)
})
```

## API

* [Core][mu-api]
* [Error handling][mu-error-api]
* Transports
  * [`mu-local`][mu-local-api]
  * [`mu-tcp`][mu-tcp-api]
  * [`mu-http`][mu-http-api] **(PLACEHOLDER - TODO)**
  * [`mu-redis`][mu-redis-api]
* Adapters
  * [`mu-balance`][mu-balance-api]
  * [`mu-tee`][mu-tee-api]
* Internals
  * [`mu-router`][mu-router-api]
  * [`mu-transport`][mu-transport-api]

## Packages

The `mu` repo is managed as a monorepo, composed of multiple npm packages.

| Package | Version | Dependencies |
|--------|-------|------------|
| [`mu`][] | [![npm](https://img.shields.io/npm/v/mu.svg?maxAge=2592000)](https://www.npmjs.com/package/mu) | [![Dependency Status](https://david-dm.org/apparatus/mu.svg?path=packages/mu)](https://david-dm.org/apparatus/mu?path=packages/mu) |
| [`mu-error`][] | [![npm](https://img.shields.io/npm/v/mu-error.svg?maxAge=2592000)](https://www.npmjs.com/package/mu-error) | [![Dependency Status](https://david-dm.org/apparatus/mu.svg?path=packages/mu-error)](https://david-dm.org/apparatus/mu?path=packages/mu-error) |
| [`mu-local`][] | [![npm](https://img.shields.io/npm/v/mu-local.svg?maxAge=2592000)](https://www.npmjs.com/package/mu-local) | [![Dependency Status](https://david-dm.org/apparatus/mu.svg?path=packages/mu-local)](https://david-dm.org/apparatus/mu?path=packages/mu-local) |
| [`mu-tcp`][] | [![npm](https://img.shields.io/npm/v/mu-tcp.svg?maxAge=2592000)](https://www.npmjs.com/package/mu-tcp) | [![Dependency Status](https://david-dm.org/apparatus/mu.svg?path=packages/mu-tcp)](https://david-dm.org/apparatus/mu?path=packages/mu-tcp) |
| [`mu-http`][] | N/A | [![Dependency Status](https://david-dm.org/apparatus/mu.svg?path=packages/mu-http)](https://david-dm.org/apparatus/mu?path=packages/mu-http) |
| [`mu-redis`][] | [![npm](https://img.shields.io/npm/v/mu-redis.svg?maxAge=2592000)](https://www.npmjs.com/package/mu-redis) | [![Dependency Status](https://david-dm.org/apparatus/mu.svg?path=packages/mu-redis)](https://david-dm.org/apparatus/mu?path=packages/mu-redis) |
| [`mu-balance`][] | [![npm](https://img.shields.io/npm/v/mu-balance.svg?maxAge=2592000)](https://www.npmjs.com/package/mu-balance) | [![Dependency Status](https://david-dm.org/apparatus/mu.svg?path=packages/mu-balance)](https://david-dm.org/apparatus/mu?path=packages/mu-balance) |
| [`mu-tee`][] | [![npm](https://img.shields.io/npm/v/mu-tee.svg?maxAge=2592000)](https://www.npmjs.com/package/mu-tee) | [![Dependency Status](https://david-dm.org/apparatus/mu.svg?path=packages/mu-tee)](https://david-dm.org/apparatus/mu?path=packages/mu-tee) |
| [`mu-router`][] | [![npm](https://img.shields.io/npm/v/mu-router.svg?maxAge=2592000)](https://www.npmjs.com/package/mu-router) | [![Dependency Status](https://david-dm.org/apparatus/mu.svg?path=packages/mu-router)](https://david-dm.org/apparatus/mu?path=packages/mu-router) |
| [`mu-transport`][] | [![npm](https://img.shields.io/npm/v/mu-transport.svg?maxAge=2592000)](https://www.npmjs.com/package/mu-transport) | [![Dependency Status](https://david-dm.org/apparatus/mu.svg?path=packages/mu-transport)](https://david-dm.org/apparatus/mu?path=packages/mu-transport) |


## Development

The `mu` repository is Monorepo, managed with [lerna](http://lernajs.io)

Each folder in packages is a distinct module, separately published to npm.

But general admin such as tests, linting, coverage, and build pipeline is managed at this repositories top level.

### Getting Started

Clone:

```sh
$ git clone https://github.com/apparatus/mu
```

Setup:

```sh
$ npm run setup 
```

This runs the [lerna bootstrap](https://lernajs.io/#command-bootstrap) command, which installs all sub-deps and links common packages together. 

Our dev environment is now set up.

### QA

- `npm test` - to run tests. Tests may be written at the top level, and in individual packages, this command will ensure all tests are run. 
- `npm run lint` - lint the code
- `npm run coverage` - run and open a coverage report.
- `npm run check` - test and lint (used as a precommit hook)

### Releasing

```sh
npm run release
```

This runs the [lerna publish](https://lernajs.io/#command-publish) command, which discovers packages that have changes, prompts for a version, then publishes each to npm, and creates a git release for the Github repository.


## Contributors

### Peter Elger

<https://github.com/pelger>

<https://twitter.com/pelger>

### David Mark Clements

<https://github.com/davidmarkclements>

<https://twitter.com/davidmarkclem>

### Dean McDonnell

<https://github.com/mcdonnelldean>

<https://twitter.com/mcdonnelldean>

### Matteo Collina

<https://github.com/mcollina>

<https://twitter.com/matteocollina>


## License
Copyright Peter Elger 2016 & Contributors, Licensed under [MIT][].

[`mu`]: packages/mu
[`mu-error`]: packages/mu-error
[`mu-local`]: packages/mu-local
[`mu-tcp`]: packages/mu-tcp
[`mu-http`]: packages/mu-http
[`mu-redis`]: packages/mu-redis
[`mu-balance`]: packages/mu-balance
[`mu-tee`]: packages/mu-tee
[`mu-router`]: packages/mu-router
[`mu-transport`]: packages/mu-transport#api
[mu-api]: packages/mu
[mu-error-api]: packages/mu-error#api
[mu-local-api]: packages/mu-local#api
[mu-tcp-api]: packages/mu-tcp#api
[mu-http-api]: packages/mu-http#api
[mu-redis-api]: packages/mu-redis#api
[mu-balance-api]: packages/mu-balance#api
[mu-tee-api]: packages/mu-tee#api
[mu-router-api]: packages/mu-router#api
[mu-transport-api]: packages/mu-transport#api
[travis-badge]: https://travis-ci.org/apparatus/mu.svg?branch=master
[travis-url]: https://travis-ci.org/apparatus/mu
[npm-badge]: https://badge.fury.io/js/mu.svg
[npm-url]: https://npmjs.org/package/mu
[logo-url]: https://raw.githubusercontent.com/apparatus/mu/master/assets/mu.png
[coveralls-badge]: https://coveralls.io/repos/apparatus/mu/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/apparatus/mu?branch=master
[sponsor]: http://nearform.com
[MIT]: ./LICENSE
