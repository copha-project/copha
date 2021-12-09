#!/usr/bin/env node
'use strict'
process.env.NODE_ENV = 'production'
import { runCli } from '../index'
runCli()