#!/usr/bin/env node
'use strict'

if(process.env.NODE_ENV === 'development') {
    console.log('----!works in development mode!----')
}
const copha = require(process.env.NODE_ENV === 'development' ? '../src/' : '../dist/')
copha()
