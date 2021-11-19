#!/bin/sh
# change your_data_dir_name use your real data
# usage:  . ./dev.env.sh
export COPHA_DEBUG=1
export COPHA_DATA_PATH="${your_data_dir_name}"
alias copha="./node_modules/.bin/ts-node -- ./src/bin/dev.ts"
