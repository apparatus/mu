# mu

[![npm][npm-badge]][npm-url]
[![travis][travis-badge]][travis-url]
[![coveralls][coveralls-badge]][coveralls-url]
[![david][david-badge]][david-url]

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

* [Core][mu]
* [Error Handling][mu-error]
* Transports
  * [mu-local][mu-local]
  * [mu-tcp][mu-tcp]
  * [mu-http][mu-http] (PLACEHOLDER - TODO)
  * [mu-redis][mu-redis]
* Adapters
  * [mu-balancer][mu-balancer]
  * [mu-tee][mu-tee]
* Internals
  * [mu-router][mu-router]
  * [mu-transport][mu-transport]

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

[mu]: tree/master/packages/mu
[mu-error]: tree/master/packages/mu-error
[mu-local][tree/master/packages/mu-local]
[mu-tcp][tree/master/packages/mu-tcp]
[mu-http][tree/master/packages/mu-http] (PLACEHOLDER - TODO)
[mu-redis][tree/master/packages/mu-redis]
[mu-balancer][tree/master/packages/mu-balancer]
[mu-tee][tree/master/packages/mu-tee]
[mu-router][tree/master/packages/mu-router]
[mu-transport][tree/master/packages/mu-transport]
[travis-badge]: https://travis-ci.org/apparatus/mu.svg?branch=master
[travis-url]: https://travis-ci.org/apparatus/mu
[npm-badge]: https://badge.fury.io/js/mu.svg
[npm-url]: https://npmjs.org/package/mu
[logo-url]: https://raw.githubusercontent.com/apparatus/mu/master/assets/mu.png
[coveralls-badge]: https://coveralls.io/repos/apparatus/mu/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/apparatus/mu?branch=master
[david-badge]: https://david-dm.org/apparatus/mu.svg
[david-url]: https://david-dm.org/apparatus/mu
[sponsor]: http://nearform.com
[MIT]: ./LICENSE
