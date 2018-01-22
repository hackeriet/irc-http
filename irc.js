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

    this.on('connect', () => this._identify(options.nick))
    this.on('ping', (host) => this.send(`PONG ${host}`))
    
    this
      .pipe(new LineBuffer())
      .pipe(EventStream([
        [ /PING (\S+)/, ([, hostname]) => this.emit('ping', {hostname}) ],
        [ /^(\S+) PRIVMSG (\S+) :(.+)/, ([, from, to, msg]) => this.emit('msg', {from, to, msg}) ],
        [ /^\S+ 376/, () => this.emit('ready') ], // End of MOTD
        [ /^\S+ 433/, () => this.emit('error', 'Nickname in use') ],
        [ /^\S+ 451/, () => this.emit('error', 'Not registered') ],
      ]))
  }

  send (msg, cb) {
    super.write(`${msg}\r\n`, cb)
    console.log('***', msg)
  }

  msg (to, text) {
    this.send(`PRIVMSG ${to} :${text}`)
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

if (!module.parent) {
  const client = new Client({
    host: 'chat.freenode.net',
    port: 6667,
    nick: 'sshowfojs',
    dryRun: true
  })
  const chan = '#hackeriet'

  client.pipe(process.stdout)

  process.stdin
    .pipe(new LineBuffer())
    .on('data', (line) => client.send(`PRIVMSG ${chan} :${line}`))

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

