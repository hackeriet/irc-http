const LineBuffer = require('./line-buffer')
const EventStream = require('./event-stream')
const { Socket, createServer } = require('net')

class Client extends Socket {
  constructor (options) {
    super(options)
    this.setEncoding('utf8')

    if (options.dryRun) {
      const serv = createServer().listen(11337)
      serv.on('connection', s => s.on('data', (data) => console.log('SERVER', data)))
      Object.assign(options, {host: 'localhost', port: 11337})
    }
    this.connect(options)

    // Raise events from socket messages
    this
      .pipe(new LineBuffer())
      .pipe(EventStream([
        [ /PING (\S+)/, ([, hostname]) => this.emit('ping', hostname) ],
        [ /^(\S+) PRIVMSG (\S+) :(.+)/, ([, from, to, msg]) => this.emit('msg', {from, to, msg}) ],
        [ /^\S+ 376/, () => this.emit('ready') ], // End of MOTD
        [ /^\S+ 433/, () => this.emit('error', 'Nickname in use') ],
        [ /^\S+ 451/, () => this.emit('error', 'Not registered') ],
        [ /^\S+ 332 [^:]+:(.+)/, ([, topic]) => this.emit('topic', topic) ],
      ]))


    // Handle the most important things automatically
    this.on('connect', () => this._identify(options.nick))
    this.on('ping', (host) => this.send(`PONG ${host}`))
    this.on('error', (err) => {
      console.error('Socket error:', err)
    })
    this.on('close', (hadError) => {
      if (hadError) {
        console.log('Reconnecting after socket transmission error')
        this.connect(options)
      }
    })
  }

  send (msg, cb) {
    if (!super.destroyed)
      super.write(`${msg}\r\n`, cb)
  }

  msg (to, text) {
    this.send(`PRIVMSG ${to} :${text}`)
  }

  notice (to, text) {
    this.send(`NOTICE ${to} :${text}`)
  }

  // TODO: This currently only supports a single channel
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

