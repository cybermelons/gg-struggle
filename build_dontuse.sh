#!/bin/bash

set -e

NODE_URL="https://nodejs.org/dist/latest"
NODE_SUM_URL="https://nodejs.org/dist/latest/SHASUMS256.txt"
SUMFILE="sums.txt"
OUTFILE_NODE="gg-struggle-node-win-64.zip"
OUTFILE="gg-struggle-win-64.zip"
OUTDIR="build"

mkdir -p $OUTDIR
rm -r $OUTDIR/node
cd $OUTDIR

# download sha sums
[ -f $SUMFILE ] || curl $NODE_SUM_URL >$SUMFILE

# download latest node
while read line; do
  SUM="$(echo -n $line | awk '{ print $1; }')"
  NAME="$(echo -n $line | awk '{ print $2; }')"
  if [[ "$NAME" =~ '-win-x64.zip' ]]; then
    # download
    curl "${NODE_URL}/${NAME}" >"$NAME"

    # check for integrity
    shasum --ignore-missing --UNIVERSAL -c $SUMFILE -q

    # all good. unzip and rename versioned dir to node
    #rm -r $OUTDIR/node
    unzip $NAME
    NODE_DIR="$(basename $NAME .zip)"
    mv $NODE_DIR node
  fi
done <$SUMFILE



# create zip archive of repo
git --git-dir=$PWD/../.git archive --format=zip -o $OUTFILE HEAD

# create a node version
cp $OUTFILE $OUTFILE_NODE
zip -r --grow $OUTFILE_NODE node/
