import Cli from './class/cli'
import Common from './common'

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

export { default as Task } from './class/task'
export { default as Driver } from './class/driver'
export { default as Storage } from './class/storage'
export { default as Project } from './class/project'
export { default as Core } from './class/core'
export { default as Utils } from 'uni-utils'