const { PassThrough } = require('stream')
const { Socket, createServer } = require('net')

const LineBuffer = require('./line-buffer')
const EventStream = require('./event-stream')

class Client extends Socket {
  constructor (options) {
    super(options)
    this.setEncoding('utf8')
    this.connect(options)

    const debugLog = new PassThrough()
    if (options.debug) {
      debugLog.on('data', (data) => console.log('DEBUG <', data.toString().trim()))
    }

    // Raise events from socket messages
    this
      .pipe(new LineBuffer())
      .pipe(debugLog)
      .pipe(EventStream([
        [ /PING (\S+)/, ([, hostname]) => this.emit('ping', hostname) ],
        [ /^(\S+) PRIVMSG (\S+) :(.+)/, ([, from, to, msg]) => this.emit('msg', {from, to, msg}) ],
        [ /^\S+ 376/, () => this.emit('ready') ], // End of MOTD
        [ /^\S+ 433/, () => this.emit('error', 'Nickname in use') ],
        [ /^\S+ 451/, () => this.emit('error', 'Not registered') ],
        [ /^\S+ 331 [^:]+:(.+)/, ([, topic]) => this.emit('topic', null) ],
        [ /^\S+ 332 [^:]+:(.+)/, ([, topic]) => this.emit('topic', topic) ],
      ]))

    // Handle the most important things automatically
    this.on('connect', () => this._identify(options.nick))
    this.on('ping', (host) => this.send(`PONG ${host}`))
    this.on('error', (err) => {
      if (err.message && err.message.match(/This socket is closed/)) {
        console.log('Socket was closed. Reconnecting...')
        this.connect(options)
      } else {
        console.error(err)
        super.destroy()
      }
    })
    this.on('close', (hadError) => {
      if (hadError) {
        console.log('Reconnecting after socket closed')
        this.connect(options)
      }
    })
  }

  send (msg, cb) {
    if (!super.destroyed) {
      super.write(`${msg}\r\n`, cb)
      console.log('DEBUG >', msg.trim())
    }
  }

  msg (to, text) {
    this.send(`PRIVMSG ${to} :${text}`)
  }

  notice (to, text) {
    this.send(`NOTICE ${to} :${text}`)
  }

  set_topic (chan, new_topic, cb) {
    this.send(`TOPIC #${chan} :${new_topic}`)
    this.once('topic', (topic) => cb(null, topic))
  }

  get_topic (chan, cb) {
    this.send(`TOPIC #${chan}`)
    this.once('topic', (topic) => cb(null, topic))
  }

  join (chan) {
    this.send(`JOIN ${chan}`)
  }

  nick (nick) {
    this.send(`NICK ${nick}`)
  }

  quit (msg) {
    this.send(`QUIT :${msg}`)
  }

  _identify (nick) {
    this.send(`USER ${nick} * * :${nick}`)
    this.nick(nick)
  }
}

module.exports = Client

