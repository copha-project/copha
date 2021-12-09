import Cli from './class/cli'
import Common from './common'
export * from './class/task'
export * from './class/driver'
export * from './class/storage'
export * from './class/project'
export * from './class/core'
// https://stackoverflow.com/questions/41892470/how-to-reexport-from-a-module-that-uses-export
import Utils from 'uni-utils'
export { Utils }

export const runCli = async () => {
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