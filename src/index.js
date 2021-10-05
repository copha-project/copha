const Cli = require('./class/cli')

module.exports = async () => {
    try {
        if(!await Cli.installCheck()) {
            process.exit(1)
        }
        
        let cli = Cli.getInstance()
    
        if(!cli) process.exit(1)

        await Cli.createCommander(cli)
    } catch (e) {
        if(Cli.getEnv('COPHA_DEBUG')){
            console.log(e)
        }else{
            Cli.log.err(e.message)
        }
    }
}
