import Cli from './class/cli'
import Common from './common'
import Task from './class/task'

const runCli = async () => {
    Common.loadPackageEnv()
    try {
        await Cli.installCheck()
        await Cli.getInstance().createCommander()
    } catch (e) {
        if(Common.isDebug){
            console.log(e)
        }else{
            Cli.log.err(e.message)
        }
        process.exit(1)
    }
}

exports.runCli = runCli
exports.Core = require('./class/core')
exports.Project = require('./class/project')
exports.Task = Task
exports.Driver = require('./class/driver')
exports.Storage = require('./class/storage')
exports.Utils = require('uni-utils')
