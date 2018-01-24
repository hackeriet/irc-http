const IRCClient = require('./irc-client')
const express = require('express')
const bodyParser = require('body-parser')

const HTTP_PORT = process.env.HTTP_PORT || 3000

const chan = '#hackeriet'
const app = express()
let server

// IRC Client
console.log('Connecting to IRC')
const client = new IRCClient({
  host: 'chat.freenode.net',
  port: 6667,
  nick: 'sshowfojs'
})

// HTTP API
app.post('/hackeriet', bodyParser.json(), (req, res, next) => {
  const msg = req.body.msg

  if (!msg || !msg.length)
    return res.status(400).json({error: 'Message must be longer than 0 chars'})

  //client.msg(chan, msg)
  client.notice(chan, msg)
  return res.status(201).json({error: null})
})

client.on('ready', () => client.join(chan))
client.on('end', () => {
  process.exit(0)
  // Close HTTP server too
  if (server)
    server.destroy()
})
//client.on('msg', (msg) => console.log(msg))

// Set up HTTP After IRC has connected
client.on('ready', () => {
  server = app.listen(HTTP_PORT, () => {
    console.log(`Listening on HTTP on port ${HTTP_PORT}`)
  })
})

// Docker container stop request
process.on('SIGTERM', () => {
  console.log('SIGTERM received')
  attemptExit()
})

// On CTRL+C
process.on('SIGINT', () => {
  console.log('SIGINT received')
  attemptExit()
})

// Handle process exit attempts
let quitAttempts = 0
function attemptExit () {
  if (++quitAttempts > 1) {
    console.error('Forcefully exiting!')
    process.exit(1)
  }
  console.log('Waiting for connection to close gracefully...')
  client.send('QUIT :quitting', () => {
    console.log('Quit successfully')
  })
}
