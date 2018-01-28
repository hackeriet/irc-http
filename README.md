# irc-http

## Usage

The HTTP API has a single method; `POST /<channel name>`, which expects
the JSON message body to contain `{"msg": "message text"}`. When successfully
invoked, it will send a `NOTICE` with the message text to the channel the
client resides in.

An example `curl` request would look like this

```
$ curl -X POST -H "Content-Type: application/json" -d '{"msg": "Hello, world!"}' http://127.0.0.1:3000/irc-http/hackeriet
```

## Install and run

### Run the binary

The included binary in `bin/irc-http` connects to an IRC server then
starts an HTTP server that serves the API.

```
$ IRC_HOST=chat.freenode.net IRC_PORT=6667 IRC_NICK=hackerbot-js IRC_CHANNEL=hackeriet bin/irc-http
```

### Run with docker

Build the image

```
$ docker build --tag irc-http .
```

Set environment and start the container. The below example will make the
HTTP server listen on `127.0.0.1:3000` on the docker host.

```
$ docker run -d --name irc-http -e IRC_HOST=chat.freenode.net -e IRC_PORT=6667 -e IRC_NICK=hackerbot-js -e IRC_CHANNEL=hackeriet -p '127.0.0.1:3000:3000' irc-http
```

The attached `docker-compose.yml` file makes this a little prettier.
