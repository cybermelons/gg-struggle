# gg-struggle

![Demo Video](media/ggmain.webm)


## tl;dr

`gg-struggle` is a program that reduces loading times by caching
the Guilty Gear server responses. Instead of taking 500+ ms/request,
this takes ~20ms/req.

Download [here][releases]

## Installation

NOTE: As of v2.0, gg-struggle runs from any directory
Please remove any previous versions of gg-struggle using the uninstaller.

### zip Archive (Windows)

Install and run by unzipping the .zip file in releases

1. Download zip file from [releases][releases].
2. Unzip to any directory, like `c:\tools\ggstruggle`
3. Run `install-gg-struggle.ps1` *as admin*
4. gg-struggle is now installed.
5. Run `start.ps1` normally before playing. You can minimize it
6. _SLASH!_

## Updating

Once installed, the client can update itself. Just run `update.ps1` on windows,
or `update.sh` on nix shells.

If that doesn't work, just download and unzip the latest installer.

## Uninstall / Remove

Run `uninstall-gg-struggle.ps1`.

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

This should be fixed in 2.0. Please report instances of this in issues.

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

I'd say it's highly unlikely because data isn't being tampered, it goes straight
from the game to servers, just maybe a little late.

Since it's untempered, there's no way to distinguish if the HTTP request was
made from the proxy or the game.

> What does installation do?

2. Modifies the `hosts` file
3. Locally generates a Self-Signed Certificate (cause you can trust youself)
  - installs to the windows root store
  - copy stored at `%ProgramFiles%/gg-struggle`

> Is this a private server?

This is NOT a private server. This is a cache that your game downloads from
the server.

> Where is my data stored/sent?

Data is never sent anywhere besides your computer and the real
servers. All the magic happens locally.

Your own HTTP response/request payloads are dumped to your temp directory,
`%TEMP%/gg-struggle/dumps`. Request headers can be viewed in a sqlite3
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

[releases]: https://github.com/tsaibermelon/gg-struggle/releases/download
