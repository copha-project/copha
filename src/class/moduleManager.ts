import Utils from 'uni-utils'
import Base from './base'
import { default as axios } from 'axios'
export default class ModuleManager extends Base {
    private _moduleHubApi: {[key:string]:string}
    private _modules: Module[] = []
    constructor(){
        super()
    }
    get modules(){
        this._modules = Utils.readJsonSync(this.constData.AppModuleDBPath)
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

    async queryModuleFromHub(name:string){
        const moduleList: Module[] = await this.queryModuleListFromHub()
        const queryModule = moduleList.find(e=>e.name === name)
        if(!queryModule) throw Error(`no module named ${name} found`)
        return queryModule
    }
    private async queryModuleListFromHub(){
        const resp = await axios.get(this.moduleHubApi.moduleList,{responseType: 'json'})
        this.log.debug('queryModuleListFromHub:',resp.status,resp.statusText,JSON.stringify(resp.data||'no data'))
        if(resp.status !== 200 || resp.data.code !== 200) throw Error('module hub not work')
        return resp.data.data
    }

    get moduleHubApi(){
        if(!this._moduleHubApi){
            const baseUrl = (this.appSettings.ModuleHub.startsWith('http') ? this.appSettings.ModuleHub : `https://${this.appSettings.ModuleHub}`) + '/api/v1/modules'
            this._moduleHubApi = {
                moduleList: `${baseUrl}`,
                packageList: `${baseUrl}/{id}/packages`,
                getModule: `${baseUrl}/{id}`,
                getPackage: `${baseUrl}/{id}/packages/{ver}`
            }
        }
        return this._moduleHubApi
    }
}

export const getModuleManager = () => ModuleManager.getInstance<ModuleManager>()