/*

This module splits an incoming text stream by newline \n, and buffers
text without a newline until an additional newline comes along, or when
the stream is closed.

*/

const Emitter = require('events')
const { Transform } = require('stream')

const EOL = '\n'

class LineBuffer extends Transform {
  constructor () {
    super({
      // Split streaming text into single line chunks
      transform: (chunk, enc, done) => {
        const str = this.buf + chunk.toString()
        this.buf = ''
        const parts = str.split(/\r?\n/)

        // Emit lines one by one
        while (parts.length > 1) {
          const line = parts.shift()
          this.push(line + EOL)
        }

        // Buffer text that doesn't have an EOL.
        // The first item of the array may be empty, which is okay.
        this.buf += parts[0]
        done(null)
      },

      // Empty the buffer before closing stream
      flush: (done) => {
        this.push(this.buf + EOL)
        this.buf = ''
        done(null)
      }
    })

    // Initialise an empty buffer
    this.buf = ''

    // TODO: Move to a test instead. Doesn't need to be here.
    this.on('end', () => {
      if (this.buf.length) {
        console.error('Stream ended with text still in buffer')
      }
    })
  }
}

module.exports = LineBuffer

// TEST
if (!module.parent) {

  const lb = new LineBuffer()
  lb.pipe(process.stdout)

  lb.write('first line\nsecond line\nand some text with no newline')
  lb.write(', but here the newline comes\n')
  lb.end('last and end\n\n')
}

