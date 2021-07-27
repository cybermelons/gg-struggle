#!/bin/sh
# Building on windows (with cygwin lol)


npm install
pkg --target node14-win .
cd tools
iscc /F"install-gg-struggle" installer.iss


