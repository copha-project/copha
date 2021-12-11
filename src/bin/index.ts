#!/usr/bin/env node
'use strict'
process.env.NODE_ENV = 'production'
import { Cli } from '../index'
Cli.run()