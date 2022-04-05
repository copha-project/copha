import {tmpdir} from 'os'
import path from 'path'
import Utils from 'uni-utils'
import {copy} from 'fs-extra'
import Base from './base'
import { default as axios } from 'axios'
import compareVersions from 'compare-versions'
import { unzip } from '../common'
import {execaCommand} from 'execa'
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
    
    getModuleByName(name:string){
        const module = this.modules.find(e=>e.name === name)
        if(!module?.active) throw Error('module inactive')
        return module
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

    //download verify unzip install move active
    async load(module:Module, modulePackage: ModulePackage){
        const packageTmpDirPath = path.resolve(tmpdir(),`copha-module/${module.id}/${modulePackage.version}`)
        const packageTmpPath = `${packageTmpDirPath}.zip`
        const packageDestDir = path.resolve(this.constData.AppModulesDir,module.name,modulePackage.version)
        await Utils.createDir(packageTmpDirPath)

        this.log.debug(`download-> ${modulePackage.url} | save : ${packageTmpPath}`)
        await Utils.download(modulePackage.url, {savePath: packageTmpPath})
        
        const md5 = await Utils.hash.getFileMd5(packageTmpPath)
        this.log.debug(`verify-> caculete md5: ${md5} | target md5 : ${modulePackage.md5}`)
        if(md5 !== modulePackage.md5) throw Error('module file hash code are not the same')
        
        this.log.debug(`unzip-> ${packageTmpPath} to ${packageTmpDirPath}`)
        await unzip(packageTmpPath, packageTmpDirPath)

        const installRes = await execaCommand('npm install',{cwd: packageTmpDirPath})
        console.log(installRes.stdout,installRes.exitCode);
        this.log.debug(`install->`)

        this.log.debug(`move-> from :${packageTmpDirPath} to ${packageDestDir}`)
        await copy(packageTmpDirPath,packageDestDir)
        this.log.debug(`active`)
    }

    async queryModuleFromHub(name:string, version?: string): Promise<[Module,ModulePackage]>{
        const moduleList = await this.queryModuleListFromHub()
        const queryModule = moduleList.find(e=>e.name === name)
        if(!queryModule) throw Error(`no module named ${name} found`)
        const packageList = await this.queryPackageListFromHub(queryModule.id)
        if(!packageList.length) throw Error("module no package")
        let queryPackage: ModulePackage | undefined
        // no version declare
        if(!version){
            queryPackage = this.getLatestVersionPackage(packageList)
        }else{
            queryPackage = packageList.find(e=>e.version === version)
        }
        if(!queryPackage) throw Error("not find version package")
        const packageItem = await this.queryPackageFromHub(queryModule.id, queryPackage.version)

        return [queryModule,packageItem]
    }

    private async queryModuleListFromHub(): Promise<Module[]> {
        const resp = await axios.get(this.moduleHubApi.moduleList,{responseType: 'json'})
        this.log.debug('queryModuleListFromHub:',resp.status,resp.statusText,JSON.stringify(resp.data||'no data'))
        if(resp.status !== 200 || resp.data.code !== 200) throw Error('module hub not work')
        return resp.data.data
    }

    private async queryPackageListFromHub(moduleId: string): Promise<ModulePackage[]>{
        const url = this.getRemotePackageListUrl(moduleId)
        const resp = await axios.get(url)
        this.log.debug('queryPackageListFromHub:',resp.status,resp.statusText,JSON.stringify(resp.data||'no data'))
        if(resp.status !== 200 || resp.data.code !== 200) throw Error('module hub not work')
        return resp.data.data
    }

    private async queryPackageFromHub(moduleId: string, version:string): Promise<ModulePackage>{
        const url = this.getRemotePackageUrl(moduleId, version)
        const resp = await axios.get(url)
        this.log.debug('queryPackageFromHub:',resp.status,resp.statusText,JSON.stringify(resp.data||'no data'))
        if(resp.status !== 200 || resp.data.code !== 200) throw Error('module hub not work')
        return resp.data.data
    }

    // private getRemoteModuleUrl(moduleId: string){
    //     return this.moduleHubApi.getModule.replace('{id}', moduleId)
    // }

    private getRemotePackageListUrl(moduleId: string){
        return this.moduleHubApi.packageList.replace('{id}', moduleId)
    }
    
    private getRemotePackageUrl(moduleId: string, version: string){
        return this.moduleHubApi.getPackage.replace('{id}', moduleId).replace('{ver}',version)
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

    private getLatestVersionPackage(packageList: ModulePackage[]){
        if(!packageList.length) throw Error('no package data')
        return packageList.find(e=>e.version === packageList.map(e=>e.version).sort(compareVersions)[packageList.length-1])
    }
}

export const getModuleManager = () => ModuleManager.getInstance<ModuleManager>()