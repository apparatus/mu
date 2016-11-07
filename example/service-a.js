const mu = require('../packages/mu')({dev: process.NODE_ENV !== 'production'})
const tcp = require('../packages/mu-tcp')

// define routing:

mu.inbound({role: 'some'}, tcp.server({port: 3000, host: '127.0.0.1'}))

// define patterns:

mu.define({role: 'some', cmd: 'thing'}, function (args, cb) {
  if (!args.pattern.user) {
    return cb(mu.error('no user found!'))
  }
  cb(null, {some: 'data'})
})
