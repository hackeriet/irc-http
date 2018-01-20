const Emitter = require('events')
const Transform = require('stream').Transform

const patternMatch = (matchers) => {
  return es.map((data, cb) => {
    for ([pattern, fn] of matchers) {
      const result = pattern.exec(data)
      if (result) {
        fn(result)
        return
      }
    }
  })
}

const emitter = new Emitter()
const emit = emitter.emit 

const matchers = [
  [ /PING (\S+)/, ([, hostname]) => emit('ping', {hostname}) ],
  [ /^(\S+) PRIVMSG (\S+) !(.+))/, (from, to, msg) => emit('msg', {from, to, msg}) ],
]

module.exports = emitter

if (!module.parent) {
  //socket
  process.stdin
    .pipe(es.split())
    .pipe(patternMatch(matchers))
    .pipe(process.stdout)
}

