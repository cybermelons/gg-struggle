# gg-struggle

![Demo Video](media/ggmain.webm)

## tl;dr

`gg-struggle` is a program that reduces loading times by caching
the Guilty Gear server responses. Instead of taking 500+ ms/request,
this takes ~20ms/req.

Download [here][releases]

### Installer

Install and run by unzipping the .zip file in releases

1. Use installer from releases [releases][releases].
2. Run `gg-struggle` before playing. Keep this window open during play
3. _SLASH!_

## Updating

Uninstall and reinstall with newest installer.

## Uninstall / Remove

Run the uninstaller from Windows.

You can verify it's removed by opening
`c:\windows\system32\drivers\etc\hosts` in a text editor like notepad. This
line should  __NOT__ exist.

```
127.0.0.1 ggst-game.guiltygear.com
```

If you see this line, open it with _notepad as administrator_ and delete the
line and save.

## Known Issues

> slow first load

The first load is always gonna be slow as normal, but subsequent loads should be faster.

> Floor lockout / old data

Ranks and floor progressions would never update for some people.

This should be fixed in 1.5 Please report instances of this in issues.

## Logs

Crashes are hopefully stored in the logs. If experiencing an issue,
please paste relevant screenshots of the log.

Windows: `%TEMP%/gg-struggle/all.log`
linux: `$TMPDIR/gg-struggle/all.log`

## FAQ

> Is this a virus? How safe is this?

This isn't a virus, people can check the code.
It's common webserver software.

> Will I get banned?

I'd say it's highly unlikely because `gg-struggle` runs as a standalone program
that does not touch the game in any way. It reads your game's network traffic
and relays it without any tampering.

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

There's no way to distinguish if the HTTP request was made from the proxy or the game.

> What does installation do?

1. Modifies the `hosts` file
2. Locally generates a Self-Signed Certificate (cause you can trust youself)
  - installs to the windows root store
  - copy stored at `%ProgramFiles%/gg-struggle`
3. Installs the `gg-struggle` proxy to your program files.

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

We remember the data from previous connections and serve that to the game
while fetching from Japan in the background.

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

[releases]: https://github.com/tsaibermelon/gg-struggle/releases/download
