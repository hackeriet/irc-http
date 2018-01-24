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
      ]))


    // Handle the most important things automatically
    this.on('connect', () => this._identify(options.nick))
    this.on('ping', (host) => this.send(`PONG ${host}`))
  }

  send (msg, cb) {
    super.write(`${msg}\r\n`, cb)
    console.log('***', msg)
  }

  msg (to, text) {
    this.send(`PRIVMSG ${to} :${text}`)
  }

  notice (to, text) {
    this.send(`NOTICE ${to} :${text}`)
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

if (!module.parent) {
  const client = new Client({
    host: 'chat.freenode.net',
    port: 6667,
    nick: 'sshowfojs'
  })
  const chan = '#hackeriet'

  client.pipe(process.stdout)

  // Write messages through stdin
  process.stdin
    .pipe(new LineBuffer())
    .on('data', (line) => client.msg(chan, line))

  client.on('ready', () => client.join(chan))
  client.on('msg', (msg) => console.log(msg))
  client.on('end', () => process.exit(0))

  let quitAttempts = 0
  process.on('SIGINT', () => {
    if (++quitAttempts > 1) {
      process.exit(1)
    }

    client.send('QUIT :quitting', () => {
      console.log('Quit successfully')
    })
  })
}

