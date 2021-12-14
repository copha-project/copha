import path from 'path'
import Module from './module'
import Project from './project'
import Utils from 'uni-utils'

export default class Task extends Module {
    private _name = null
    private _storage = null
    private _driver = null
    private _custom = null
    private _projectConfig: ProjectConfig
    private _conf = null
    constructor() {
        super()
    }

    setConfig(projectConfig){
        this._name = projectConfig.main.task
        this._projectConfig = projectConfig
        this._conf = projectConfig?.Task || {}
    }

    setStorage(storage){
        this._storage = storage
    }

    setDriver(driver){
        this._driver = driver
    }

    setCustom(custom){
        this._custom = custom
    }

    async init(){}
    async runTest(){}

    async loadState(){}

    async runBefore(){}
    async run(){}
    async saveContext(){}
    async recover(){}
    async reset(){}
    async clear(){}

    getPath(name:string){
        return Project.getPath(this.projectName, name)
    }

    getResourcePath(name:string, type="json"){
        return path.join(this.getPath('task_file'),`${name}.${type}`)
    }

    checkNeedStop(){

    }

    get helper(){
        return {
            uni: Utils
        }
    }

    get conf(){
        return this._conf
    }

    get projectConfig(){
        return this._projectConfig
    }

    get custom(){
        return this._custom
    }
 
    get driver(){
        return this._driver
    }
 
    get storage(){
        return this._storage
    }

    get projectName(){
        return this._projectConfig?.main.name
    }

    get name(){
        return this._name
    }
}