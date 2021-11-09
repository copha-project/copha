#!/usr/bin/env node
'use strict'
process.env.NODE_ENV = 'production'
require('../dist/').runCli()
