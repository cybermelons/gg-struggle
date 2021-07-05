
# Building

## (WIP) with nodejs (linux, macos, windows)

```
git clone https://git.yeet.st/cybermelon/gg-struggle/
cd gg-struggle/server
npm install
node remote.js
```

TODO write `remote.js` with configurations for a remote server

## windows .exe

The windows package is a combo of nodejs's `pkg` and some scripts.
The installer is compiled with Inno Setup run from the `tools/` directory.

```
git clone https://git.yeet.st/cybermelon/gg-struggle/
cd gg-struggle/server
npm install
pkg --target node14-win .
cd ../tools
iscc /F"install-gg-struggle" installer.iss
```


