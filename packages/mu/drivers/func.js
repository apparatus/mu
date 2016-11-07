var util = require('util')
if (process.emitWarning) {
  process.emitWarning('mu/drivers/func is DEPRECATED, please switch to http://npm.im/mu-local as this will be removed soon')
} else {
  console.warn('WARNING: mu/drivers/func is DEPRECATED, please switch to http://npm.im/mu-local as this will be removed soon')
}

module.exports = util.deprecate(
  require('mu-local'),
  'mu/drivers/func is DEPRECATED, please switch to http://npm.im/mu-local as this will be removed soon'
)
