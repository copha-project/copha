const path = require('path')
const Cli = require('./class/cli')
const { isDebug } = require('./common')
const loadPackageEnv = () => {
    const packageDir = path.dirname(path.dirname(__dirname))
    // module.paths.push(packageDir)
    if(!process.env.NODE_PATH){
        process.env.NODE_PATH = packageDir
    }else{
        throw new Error("NODE_PATH  has value!")
    }
    require('module').Module._initPaths()
}
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
