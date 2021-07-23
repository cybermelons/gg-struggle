# gg-struggle

![Demo Video](media/ggmain.webm)

# 🔥⚠ HOTFIX

For those suddenly getting network issues, you can replace the ip address with the right one
in your hosts file.

1. `ping ggst-game.guiltygear.com`. Note the IP address:

```
Pinging ggst-game.guiltygear.com [<ip addr>] with 32 bytes of data:
```

3. Run notepad as administrator
4. Change the line with `ggst-game-real.guiltygear.com`. Note the **`real`**

```
# C:\windows\system32\drivers\etc\hosts
<ip addr> ggst-game-real.guiltygear.com
```

## tl;dr

`gg-struggle` is a program that reduces loading times by caching
the Guilty Gear server responses. Instead of taking 500+ ms/request,
this takes ~20ms/req.

Download [here](https://github.com/tsaibermelon/gg-struggle/releases/download/v1.4.1/install-gg-struggle-v1.4.1.exe)

### Usage

1. Install using `install-gg-struggle.exe`.
2. Start `gg-struggle`. Keep this console open while guilty gear is running.
3. _SLASH!_

## Overview

`gg-struggle` is a local webserver that caches responses from the guilty
This speeds up loading and menu times for regions furthest from Japan (NA, EU)

I'll update this with more documentation as I have time

### Automated Install

Install using the `install-gg-struggle.exe` installer.

1. run `install-gg-struggle.exe`
2. Launch `gg-struggle.exe` through the start menu
3. Load game

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

## Known Issues

> slow first load

The first load is always gonna be slow as normal, but subsequent loads should be faster.

> Floor lockout / old data

As of 1.3, any changes to player data won't show in the client for 24 hours.
Future versions will dynamically cache data based on the request routes,
so that trivial data like player lobbies are always up-to-date.

This'll be fixed in the next patch.

## Logs

Windows: `%TEMP%/gg-struggle/all.log`
linux: `$TMPDIR/gg-struggle/all.log`

## FAQ

> Will I get banned?

The likelihood of getting banned is highly unlikely, since we're not tampering
with the game data nor the game client. We're just sitting on the network
between the game and servers, cleanly passing data along.

We are sending slightly stale data back to the game client, so there can be
some client-side bugs with out-of-date info, like showing a lobby list with
someone who already left.

> Why does this need admin privileges to install?

We need to do two things with admin:

1. Force windows to redirect all traffic from the game to your computer
   running the proxy, gg-struggle. We do this by editing the hosts file
2. Spoof the authenticity of the gg-struggle with your own self-signed cert.
   We need to assure windows that it can trust gg-struggle is the
   real `ggst-game.guiltygear.com`, even though it's really not.


> What does the installation do?

The installation does 3 things

1. Installs the .exe file
2. Modifies the `hosts` file
3. Locally generates a Self-Signed Certificate
  - installs to the windows root store
  - copy stored at `%ProgramFiles%/gg-struggle`

> Why is GG:ST so slow?

The only GG servers are located in Japan.

When the game loads, a 100+ of HTTP requests are sent serially. Each request
can take ~200-1500ms due to latency from a region like NA to Japan. This adds
up to roughly `100 * 800 = 80+ seconds` in the average case.


> Why doesn't the game just lump the requests into one big one?

In Japan, the devs probably didn't experience this problem. 100 requests at 10ms/req
is a 1 sec load time in Japan. With such low latency, sending them one-by-one is
trivial.

The game server API and infrastructure may also be outsourced to a 3rd party contractor and not the game devs themselves.
Assuming their devs specialize in games and not network infrastructure, it would
make a lot of sense for them to pay someone else to do this while their devs
overwork themselves on the game itself.

> How does gg-struggle fix this?

I've written an in-depth non-tech explanation in the form of a movie heist in
[EXPLANATION.md](docs/EXPLANATION.md)

> How do we trick the game to use the gg-struggle instead of the real servers?

We add the redirect rule in the hosts file. This file is Windows' global
override for what IP address a specific domain is located. Since this is a
system file, we need admin to edit it.

> What about the SSL certs? Why does it need to install this cert into the root
> store of my computer?

We can lead the game to the proxy, but it will reject the connection if
gg-struggle can't prove its identity. Installing the cert tells Windows that
it can trust the authenticity of gg-struggle.

With the cert installed, we can lead the game to our proxy and the game will
believe it's the real server and not a spoofer.

> Isn't using a self-signed certificate insecure?

Well, no. Not as long as you generated it yourself and didn't share it.
Installing a cert means you trust the identity of anyone
who owns the key. You're the only one who owns it, so you're just adding
yourself to the list of people you trust.

Installing a _self-signed_ cert means nobody else except the owner can vouch
for its authenticity. Usually certs are signed by a trusted CA
but this one is signed by just the owner.
Since you generated it yourself, you can safely trust it even though nobody else
does.

> Can an attacker use this self-signed cert to spoof other websites?

Only if they manage to get ahold of it by reading your hard drive. And if
they can, your computer's already compromised.

Even if they did read it, they'd also need to spoof your DNS to redirect you
to the IP address of their fake site.


> What was the old security concern with the self-signed SSL cert?

In previous versions, I gave out my pre-generated SSL cert that I used during
testing instead of generating it at install.
This would allow anyone with the key (everyone) to spoof any website
and steal the victim's data with no warning. But even then, that would only be
possible if victim mistakenly went to the wrong IP address via a separate DNS
exploit.

As of v1.3+, this no longer exists by generating the cert locally. The previous
insecure releases have been removed from GitHub.

> Is this a private game server?

This is NOT a private server. This is a proxy-cache that your game downloads from
the server.

> Where is my data stored/sent?

Data is never sent anywhere besides your computer and the real game servers.
All the magic happens locally.

The HTTP response/request payloads are stored in your temp directory,
`%TEMP%/gg-struggle/dumps`. Request headers can be viewed in a sqlite3
database named `%TEMP%/gg-struggle/gg-struggle.db`.

> Does this affect gameplay at all?

Nope. The gameplay itself doesn't deal with this HTTP api endpoint
to coordinate gameplay. This only affects out-of-game stuff like menus.

## Removal

**! FAILSAFE !**

If everything goes wrong, **edit the hosts file to remove any line that
says `ggst-game.guiltygear.com`**. You must restart the game afterwards.
It wouldn't hurt to also run `ipconfig /flushdns` afterwards.

You should also remove the `gg-struggle` certificate by

1. Run `certmgr.msc` as admin
2. Navigate to "Trusted Root Certifcation Authorities"
3. Delete `gg-struggle`
