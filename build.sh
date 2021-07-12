#!/bin/bash

set -e

version="v14.17.3"
node_dir="node-${version}-win-x64"
node_zip="node-${version}-win-x64.zip"

[ -f /tmp/${node_zip} ] || curl "https://nodejs.org/dist/${version}/${node_zip}" >/tmp/${node_zip}
mkdir -p build
unzip -o -d build/ /tmp/${node_dir}
mv build/${node_dir} build/node/

