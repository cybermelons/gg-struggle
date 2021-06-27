# Installation

1. Edit `C:/windows/system32/drivers/etc/hosts` and add this line

    144.217.72.171 ggst-game.guiltygear.com

2. Download this certifciate file and install on winddows under Trusted Root Certificates: [click here](windows.p12)

3. Run guilty gear. The first time it loads will be slow but every other time after should be faster.

# Issues

The server doesn't ever refresh the cache. Over time the game stats and lobbies might start being incorrect due to stale data. I'm gonna implement cache-invalidation after like, a day or two.


