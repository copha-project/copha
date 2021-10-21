#!/bin/sh
# usage:  . ./dev.env.sh
export COPHA_DEBUG=1
export COPHA_DATA_PATH="${your_data_dir_name}"
alias copha="./node_modules/.bin/babel-node -- ./bin/dev.js"
