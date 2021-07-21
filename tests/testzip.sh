#!/bin/bash

set -e

usage() {
  echo "$0 <gg-struggle_zipfile>"
}

if [ -z $1 ]; then
  usage && exit 1
fi

unzip $1 -d tmp
cd tmp
npm install
node update.js
