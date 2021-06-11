# irc-http

## Usage

API endpoints

### `POST /channel`

Accepts `Content-Type: application/json` with a body like `{"msg": "message text"}` which sends a notice to the channel.

#### Returns

- `204` with an empty body on success

### `GET /topic`

#### Returns

- `200` with a body like `{"channel":"hackeriet","topic":"The space is: CLOSED | irc is: PUBLIC | hackeriet.no | ☯"}`


## Examples

An example `curl` request for a client in `#hackeriet` would look like this

```
$ curl -X POST -H "Content-Type: application/json" -d '{"msg": "Hello, world!"}' http://127.0.0.1:3000/hackeriet
```

## Install and run

### Run the binary

Requires Node.js v6 or later.

Install package dependencies

```
$ npm install
```

The included binary in `bin/irc-http` connects to an IRC server then
starts an HTTP server that serves the API.

```
$ IRC_HOST=irc.libera.chat IRC_PORT=6667 IRC_NICK=hackerbot-js IRC_CHANNEL=hackeriet bin/irc-http
```

### Run with docker

Build the image

```
$ docker build --tag irc-http .
```

Set environment and start the container. The below example will make the
HTTP server listen on `127.0.0.1:3000` on the docker host.

```
$ docker run -d --name irc-http -e IRC_HOST=irc.libera.chat -e IRC_PORT=6667 -e IRC_NICK=hackerbot-js -e IRC_CHANNEL=hackeriet -e DEBUG=1 -p '127.0.0.1:3000:3000' irc-http
```

The attached `docker-compose.yml` file makes this a little prettier.
