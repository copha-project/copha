import Utils from 'uni-utils'
import Base from './base'

export default class ModuleManager extends Base {
    private _modules: Module[]
    constructor(){
        super()
    }
    get modules(){
        if(!this._modules.length){
            this._modules = Utils.readJsonSync(this.constData.AppModuleDBPath)
        }
        return this._modules
    }
    
    getModuleListByType(typeName:string){
        return this.modules.filter(e=>e.type === typeName)
    }

    getTaskList() {
        return this.getModuleListByType(ModuleType.Task)
    }

    getDefaultModuleByType(typeName: ModuleType) {
        const defaultModule = this.getModuleListByType(typeName).find(e=>e.default && e.active)
        if(!defaultModule) throw Error(`no default and active ${typeName} module in Copha!`)
        return defaultModule
    }

    getDefaultTask(){
        return this.getDefaultModuleByType(ModuleType.Task)
    }

    getDefaultModuleByName(name:string){
        const module = this.modules.find(e=>e.name === name)
        if(!module) throw Error("not find module")
        if(!module.active) throw Error("module is inactive")
        return module
    }
}

export const getModuleManager = () => ModuleManager.getInstance<ModuleManager>()