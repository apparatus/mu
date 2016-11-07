const mu = require('../packages/mu')({dev: process.NODE_ENV !== 'production'})
const tcp = require('../packages/mu-tcp')

// define routing:

mu.outbound({role: 'some'}, tcp.client({port: 3000, host: '127.0.0.1'}))

// define patterns:

mu.dispatch({role: 'some', cmd: 'thing', user: 'me :)'}, function (err, result) {
  if (err) {
    return console.error(err)
  }
  console.log(result)
})
