# mu-error

The official error handling library for mu

[![npm][npm-badge]][npm-url]
[![travis][travis-badge]][travis-url]
[![coveralls][coveralls-badge]][coveralls-url]
[![david][david-badge]][david-url]

- __Sponsor:__ [nearForm][sponsor]
- __Status:__ Experimental

Part of the Official [mu][Mu Suite].

`mu-error` provides distributed error handling functionality to [mu][`mu`]. Of note, it ensures stack serialization, preserves remote stack traces and prevents exposing internal errors to production users.

* [Overview](#install)
* [Quick Start](#quick-start)
* [API](#api)
* [Features](#features)
* [Install](#install)
* [License](#license)

## Overview

`mu-error` is exported on the `mu` object as `mu.error`. There is usually no need to install.

`mu.error` creates decorated [`boom`](http://npm.im/boom) objects, which allows
for compatibility with the Hapi `reply` function, without losing any value when
integrating with other frameworks such as Express or Koa. 

While `boom` allows HTTP status codes of 400+, `mu-error` reserves the range
of 1..99 for mu specific errors, creating an error with this a code this range
will generate an HTTP status code of 500 by default and inject the mu error context into the `boom` error `output` object.

## Quick Start

### Example

If used in a service context, simply call `mu.error` with a string.

```js
const mu = require('mu')({dev: process.NODE_ENV !== 'production'})

mu.define({role: 'some': cmd: 'thing'}, function (args, cb) {
  if (!args.pattern.user) {
    return cb(mu.error('no user found!'))
  }
  cb(null, {some: 'data'})
})
```

This will create an object like the following: 

```js
{ Error: <Error Object>,
  data: null,
  isBoom: true,
  isServer: true,
  output:
   { statusCode: 500,
     payload:
      { statusCode: 500,
        error: 'Internal Server Error',
        message: 'An internal server error occurred' },
        mu:
          { code: 1,
            error: 'general service error',
            message: 'no user found!' } },
     headers: {},
     mu:
      { code: 1,
        error: 'general service error',
        message: 'no user found!' } },
  reformat: [Function],
  isMu: true }
```

This output assumes `NODE_ENV` is not 'production', when not in dev mode the `output.payload.mu` is not added, which means error specifics are hidden from production users.


## API

### `require('mu')({errors: MU_ERROR_OPTIONS})`

`mu-error` is created automatically by `mu`, the `errors` property of the options object passed to `mu` is passed on to `mu-error` which has the following options:

* `dev` (`false`) if set on the `errors` object it can override the top level `dev` option for mu - see [Dev Mode](#dev-mode)
* `httpCode` (`500`) - see [Custom mu error HTTP status code](#custom-mu-error-http-status-code)
* `serializeErrorProps` (`true`) - see [Serialize Error Props](#serialize-error-props)
* `maxRemoteStacks` (`dev ? Infinity : 20`) see [Remote Errors](#remote-errors)

### `mu.error(code|message, message|data, data)`

The main function for creating mu error objects.

The first arguments may be a number between 1 and 99, or 400+, 
or a string (or undefined).

As with boom, a `data` parameter can be passed to attach any useful state to the 
error context.

**Alias**: `mu.error.create`

### `mu.error.wrap(error, muCode, statusCode, message)`

Same concept as `boom.wrap`.

Wraps an `Error` (or `boom`) object (included deserialized `boom` objects) with a mu error object, 
or adds mu context to a pre-existing `boom` object.

### `mu.error.wrapRemote(error, muCode, statusCode, message)`

Intended to wraps a (usually deserialized `boom` schema) object (i.e. an error propagating across a transport), and keeps a live list of remote stacks as an array on `err.remoteStacks`. See [Remote Errors](#remote-errors).

**Alias**: `mu.error.remote`

### `mu.error.makeMuError(muCode, httpStatusCode, message, data)`

Directly create a mu error object, this method can be used to 
create a single mu error object with a custom http status code.

### `mu.error.extract(err)`

Inverts the shape of the `boom` object so that the mu error context is at the top level, along with payload and data objects.

For example: 

```js
console.log(mu.error.extract(mu.error('no user found!'))) 
```

Would give

```js
{ code: 1,
  error: 'service error',
  message: 'no user found!',
  data: null,
  payload:
   { statusCode: 500,
     error: 'Internal Server Error',
     message: 'An internal server error occurred' } }
```

### Mu Constants

The `mu.error.ERRORS` object has the following constants

```js
  SERVICE: 1,
  FRAMEWORK: 2,
  TRANSPORT: 3,
  UNKNOWN: 99
```

### Mu Codes

The following codes (`mu.error.MU_CODES`) represent internal mu errors

```js
  1: 'service error',
  2: 'framework error',
  3: 'transport error',
  99: 'unknown'
```

In userland the only code currently of interest is the `service error`, the other codes are used in mu internally.

### `mu.error.service(message|Error, data)`

Generate a service error. 

When passed a message, this is functionally equivalent to calling `mu.error` directly without a code. (`mu.error('message') === mu.error.service('message')`).

When passed an `Error` (or `boom`) object it wraps the object with the correct mu context

When passed an `Error` this is the equivalent of calling `mu.error.wrap` (`mu.error.wrap(Error('foo') === mu.error.service(Error('foo'))`)

### `mu.error.framework(message|Error, data)`

Generate a framework error, used internally by mu

When passed an `Error` (or `boom`) object it wraps the object with the correct mu context

### `mu.error.transport(message|Error, data)`

Generate a transport error, used internally by mu

When passed an `Error` (or `boom`) object it wraps the object with the correct mu context

## Features

### Remote Errors

Errors that have been propagated from another service can be passed to `mu.error.wrapRemote`. This is for cases where the deserialized `stack` property relates to a stack in another process. Passing the error to `mu.error.wrapRemote` will place a new local stack on the `err.stack` property, and append the remote stack to a `err.remoteStacks` array, which contains the object of the form `{timestamp, stack}`.

The `maxRemoteStacks` option can be used to set the maximum allowed stacks to retain in `err.remoteStacks`. This defaults to 30 when the `dev` option is false, or `Infinity` in `dev` mode.

### Generate Specific HTTP errors

`mu.error` can be used in the same way as `boom` to create http errors

```js
mu.define({role: 'some': cmd: 'thing'}, function (args, cb) {
  if (!args.pattern.user) {
    return cb(mu.error(401, 'no user found'))
  }
  cb(null, {some: 'data'})
})
```

The `boom` methods are also supported

```js
mu.define({role: 'some': cmd: 'thing'}, function (args, cb) {
  if (!args.pattern.user) {
    return cb(mu.error.unauthorized('no user found'))
  }
  cb(null, {some: 'data'})
})
```

See the [boom](http://npm.im) docs for more.

## Error Serialization

`mu.error` uses `boom` and `boom` objects are `Error` objects.

The native `Error` object has `message` and `stack` properties but they are non-enumerable, which means they don't get serialized (via `JSON.stringify`). This is somewhat awkward in a service-based system.

By default `mu.error` will make sure these values end up in the stringify output. To turn this off (e.g. perhaps in production) use `serializeErrorProps`:

```js
require('mu')({errors: {serializeErrorProps: false}})
```

## Custom mu error HTTP status code

In the event of a mu error, the status code is 500 (internal server error).

We can set this to default to another code:

```js
require('mu')({errors: {httpCode: 509}})
```

If we want to specify an error code on an individual basis we can use the `mu.error.makeMuError` method directly (see [#api](API)). 


## Install

`mu-error` is exported on the `mu` object, so for general usage we install `mu`:

```sh
$ npm install mu
```

Then access 

```js
const mu = require('mu')()
console.log(mu.error('ah ok'))
```

For internal usage, or testing purposes `mu-error` can also be installed directly:

```sh
$ npm install mu-error
```

## License
Copyright David Mark Clements & Contributors, Licensed under [MIT][].


[mu]: https://github.com/apparatus/mu
[travis-badge]: https://travis-ci.org/apparatus/mu.svg?branch=master
[travis-url]: https://travis-ci.org/apparatus/mu
[npm-badge]: https://badge.fury.io/js/mu.svg
[npm-url]: https://npmjs.org/package/mu
[logo-url]: https://raw.githubusercontent.com/apparatus/mu/master/assets/mu.png
[coveralls-badge]: https://coveralls.io/repos/apparatus/mu/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/apparatus/mu?branch=master
[david-badge]: https://david-dm.org/apparatus/mu.svg
[david-url]: https://david-dm.org/apparatus/mu?path=packages/mu-error
[sponsor]: http://nearform.com
[MIT]: ./LICENSE