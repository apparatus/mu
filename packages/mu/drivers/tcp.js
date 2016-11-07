var util = require('util')
var tcp = require('mu-tcp')
if (process.emitWarning) {
  process.emitWarning('mu/drivers/tcp is DEPRECATED, please switch to http://npm.im/mu-tcp as this will be removed soon')
} else {
  console.warn('WARNING: mu/drivers/tcp is DEPRECATED, please switch to http://npm.im/mu-tcp as this will be removed soon')
}

module.exports = {
  server: util.deprecate(
    tcp.server,
    'mu/drivers/tcp is DEPRECATED, please switch to http://npm.im/mu-tcp as this will be removed soon'
  ),
  client: util.deprecate(
    tcp.client,
    'mu/drivers/tcp is DEPRECATED, please switch to http://npm.im/mu-tcp as this will be removed soon'
  )
}
