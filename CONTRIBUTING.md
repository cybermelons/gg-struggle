# Contributing Guide

Please help me. Fork this. Write in the wiki. Open a million issues. Add docs,
ask questions. I will try my best

DM me on discord: Cybermelon#1969

## Overview

`gg-struggle` is a local webserver that caches responses from the guilty
This speeds up loading and menu times for regions furthest from Japan (NA, EU)

The user package consists of

1. a nodejs webserver w/ scripts
  - self-signed SSL certs
  - hosts file patch
2. sqlite db to
3. payload dumps in temp dir

Cache is in-memory, and payloads are stored between sessions via sqlite and
dump files.

### Usage w/ git and nodejs

Clone into any directory, create a self-signed cert, and run like any node
package.

```
git clone https://github.com/tsaibermelon/gg-struggle
cd gg-struggle

# create key
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -config tools/localhost.cnf
openssl pkcs12 -export -out gg-struggle-cert.pfx -inkey key.pem -in cert.pem

# copy sample config and run w/ it
cp server/local.json myconfig.json
node . myconfig.json
```

## How It Works

### Problem

When loading up the main menu, the guilty gear game downloads all your game
data in several HTTP (100+) requests to the game servers. These requests
are done in order, waiting for one to complete before doing the next.

Making this many requests isn't too bad, until you factor in latency.
Each request has to go to Japan and back, ~250ms each way / ~500+ ms total.
Multiply this by 100 requests and no wonder it can take it 5 minutes.

A good explanation of this can be found on reddit: [here](https://www.reddit.com/r/Guiltygear/comments/oaqwo5/analysis_of_network_traffic_at_game_startup)

### Solution

tl;dr cache the responses and send old ones back to the game immediately.

To solve this we put a fake server (`gg-struggle`) in the middle, between the game and the server.
We trick our game into thinking `gg-struggle` is the real server and asks
it for data. `gg-struggle` makes the same request to the real server and copies the response
back to the game. Then saves the response for later.

The next time the game tries to make the same request (e.g. download latest news),
`gg-struggle` will already have saved that data from earlier and return it back
immediately.
