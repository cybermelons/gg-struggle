#!/bin/sh

set -x

curl -d $(bash ./get_news.data) https://${host}/api/statistics/get
