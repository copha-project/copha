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

module.exports = {
    runCli
}
