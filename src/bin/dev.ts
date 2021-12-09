#!/usr/bin/env node
'use strict'
process.env.NODE_ENV = 'development'
console.log('----! works in development mode !----')
import { runCli } from '../index'
runCli()