const path = require('path')
const Base = require('./base')
const Project = require('./project')

class Task extends Base {
    private _name = null
    private _storage = null
    private _driver = null
    private _custom = null
    private _projectConfig = null
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

    async run(){}
    async saveContext(){}
    async recover(){}
    async reset(){}
    async clear(){}

    getPath(name){
        return Project.getPath(this.projectName, name)
    }

    getResourcePath(name, type="json"){
        return path.join(this.getPath('task_file'),`${name}.${type}`)
    }

    checkNeedStop(){

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

module.exports = Task

export {
    Task
}