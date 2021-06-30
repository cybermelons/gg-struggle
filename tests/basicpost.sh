#!/bin/bash

set -x

let host='localhost'

curl \
  "$@" \
  -d $(bash ./get_news.data) \
  --connect-to ggst-game.guiltygear.com:443:localhost:443 \
  https://ggst-game.guiltygear.com/api/statistics/get

