#!/usr/bin/env node
'use strict'
const pkg = require('../package')
const path = require('path')
const commander = require('commander')
const program = new commander.Command()
const Cli = require('../src/cli')

let cli = Cli.getInstance()
if(!cli) return

program.version(pkg.version, '-v, --version', 'output the current version')

program.command('create <name>')
    .description('create a new task')
    .action(cli.createTask)

program.command('delete <name>')
    .description('delete a task')
    .action(cli.deleteTask)

program.command('run <name>')
    .description('run a task')
    .option('-e, --export', 'export data only')
    .option('-t, --test', 'custom test only')
    .option('-d, --daemon', 'run with daemon mode')
    .option('-c','run custom code')
    .action(cli.runTask)

program.command('stop <name>')
    .description('stop a task')
    .option('-r, --restart', 'stop and restart task')
    .action(cli.stopTask)

program.command('reset <name>')
    .description('reset a task')
    .option('--hard', 'delete all data of task')
    .action(cli.resetTask)

program.command('list')
    .description('list all task')
    .action(cli.listTask)

program.command('config [name]')
    .description('set global or task config or custom code')
    .option('-s, --set <key=value>', 'set config')
    .option('--custom', 'edit custom exec code')
    .option('-o --overwrite', 'edit overwrite code of task')
    .option('--export_data', 'edit custom export data code')
    .action(cli.setConfig)

program.command('server')
    .description('launch a web server')
    .option('-H, --host', 'server address, default use 127.0.0.1')
    .option('-p, --port', 'server port, default use 7000')
    .option('-d, --daemon', 'run with daemon')
    .action(cli.server)

async function main(){
    if(await cli.checkRun()){
        await program.parseAsync(process.argv)
    }
}

(async ()=>{
    try {
        await main()
    } catch (e) {
        if(cli.getEnv('COPHA_DEBUG')){
            console.log(e)
        }else{
            cli.log.err(e.message)
        }
    }
})()
