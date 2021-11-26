const Cli = require('./class/cli')
const { isDebug, loadPackageEnv } = require('./common')

const runCli = async () => {
    loadPackageEnv()
    try {
        await Cli.installCheck()
        await Cli.getInstance().createCommander()
    } catch (e) {
        if(isDebug){
            console.log(e)
        }else{
            Cli.log.err(e.message)
        }
    }
}

exports.runCli = runCli
exports.Core = require('./class/core')
exports.Project = require('./class/project')
exports.Task = require('./class/task')
exports.Driver = require('./class/driver')
exports.Storage = require('./class/storage')
exports.Utils = require('uni-utils')