# gg-struggle

![Demo Video](media/ggmain.webm)

## tl;dr

`gg-struggle` is a program that reduces loading times by caching
the Guilty Gear server responses. Instead of taking 500+ ms/request,
this takes ~20ms/req.

### Usage

1. Install using `install-gg-struggle.exe`. **[Download here](https://git.yeet.st/attachments/141bca1c-fc95-43fb-9209-8cb29e45c5a9)**
2. Start `gg-struggle`. Keep this console open while guilty gear is running.
3. Start guilty gear: strive.

NOTE: While installed, `gg-struggle` MUST be running while the game is up.
You must uninstall to revert things to normal.

### Manual Install

1. Run `certmgr.exe` as admin
2. Import `gg-struggle-cert.pem` under the **"Trusted Root Certification Authority"**
3. Edit `c:\windows\system32\drivers\etc\hosts` file as admin to include the following lines

    127.0.0.1 ggst-game.guiltygear.com
    3.112.119.46 ggst-game-real.guiltygear.com

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

## Issues

Since we send cached data back to the game, the game may be displaying out-of-date information,
e.g. ranking. Data is cached for a day (at-most) while the program is running.
This doesn't affect gameplay.

The first load is always gonna be slow as normal, but subsequent loads should be faster.

## FAQ

> Is this a private server? Or is this connecting to official servers?

This is NOT a private server. Everything connects to the real servers.

> Is this a virus? How safe is this? Will I get banned?

This is 100% safe. No game files or packets are tampered with,
and the executable running is just a common webserver like apache or nginx.

The HTTP requests that are cached are forwarded raw from the
game to the real gg server. There's no way to distinguish if the HTTP
request was made from the proxy or the game.

> What does the installation do?

The installation does 3 things

1. Installs the .exe file
2. Modifies the `hosts` file
3. Installs a self-signed SSL certificate

> Where is my data stored/sent?

Data is never sent anywhere besides your computer and the real
servers. All the magic happens locally.

The HTTP response/request payloads are stored in your temp directory,
`%TEMP%/gg-struggle/dumps`. Request data can be viewed as a sqlite3
database in `%TEMP%/gg-struggle/gg-struggle.db`.

> Does this affect gameplay at all?

Nope. The gameplay itself doesn't deal with this HTTP api endpoint
to coordinate gameplay. This only affects out-of-game stuff like menus.

## Removal

**! FAILSAFE !**

If everything goes wrong, **edit the hosts file to remove any line that
says `ggst-game.guiltygear.com`**. You must restart the game afterwards.

You should also remove the `gg-struggle` certificate by

1. Run `certmgr.msc` as admin
2. Navigate to "Trusted Root Certifcation Authorities"
3. Delete `gg-struggle`
