/*

This module returns a transform stream that can be used
in a pipeline. It takes a single argument containing a
list of pairs each containing a regex pattern, and
a function to run when the pattern matches the incoming
string.

The following example parses a logfile and prints out
INFO messages to stdout and ERROR messages to stderr.

fs.createReadStream('./logfile.log')
  .pipe(new LineBuffer()) // split chunks by lines
  .pipe(new EventStream([
    [/$INFO: (.+)^/, ([match, message]) => console.log(message)],
    [/$ERROR: (.+)^/, ([match, message]) => console.error(message)]
  ]))

*/

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

