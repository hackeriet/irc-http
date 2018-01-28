const Client = require('../irc-client')
const LineBuffer = require('../line-buffer')

const client = new Client({
  host: 'chat.freenode.net',
  port: 6667,
  nick: 'sshowbro'
})
const chan = '#hackeriet'

client.pipe(process.stdout)

// Send lines fom stdin as messages
process.stdin
  .pipe(new LineBuffer())
  .on('data', (line) => client.msg(chan, line))

client.on('ready', () => {
  console.log('Joining channel')
  client.join(chan)
})
client.on('msg', (msg) => console.log(msg))

// Close connection gracefully on CTRL+C
process.on('SIGINT', () => {
  client.quit('Sayonara!', () => {
    console.log('Quit gracefully')
  })
})

