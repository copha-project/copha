const Cli = require('./class/cli')
const { isDebug } = require('./common')

module.exports = async () => {
    try {
        await Cli.installCheck()

        let cli = Cli.getInstance()

        await cli.createCommander()
    } catch (e) {
        if(isDebug){
            console.log(e)
        }else{
            Cli.log.err(e.message)
        }
    }
}
