const { Transform } = require('stream')
const EventEmitter = require('events')

function EventStream (patternMap) {
  return new Transform({
    transform(chunk, encoding, done) {
      const str = chunk.toString('utf8')
      for ([pattern, fn] of patternMap) {
        const result = pattern.exec(str)
        if (result) {
          fn(result)
          // Stop looking after first match
          break;
        }
      }
      done()
    }
  })
}

module.exports = EventStream

