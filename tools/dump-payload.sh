#!/bin/bash

tail -c +5 $1 | xxd -r -p
