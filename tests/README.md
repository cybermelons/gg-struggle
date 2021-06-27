# Installation

1. Edit `C:/windows/system32/drivers/etc/hosts` and add this line. This
   tells Windows to redirect gg traffic to the proxy.

```
144.217.72.171 ggst-game.guiltygear.com
```

2. Run the following command cmd prompt or in Win+R. This will reset your
   settings to apply the new hosts file.

```
ipconfig /flushdns
```


3. Download this certifciate file and install on winddows under Trusted Root Certificates: [click here](windows.p12). This will allow your computer to trust the proxy server.

4. Run guilty gear. The first time it loads will be slow but every other time after should be faster.

# Issues

The server doesn't ever refresh the cache. Over time the game stats and lobbies might start being incorrect due to stale data. I'm gonna implement cache-invalidation after like, a day or two.


