const path = require('path')
const Base = require('./base')
const Project = require('./project')

class Task extends Base {
    // task name
    #name = null
    #storage = null
    #driver = null
    #custom = null
    #projectConfig = null
    #conf = null
    constructor() {
        super()
    }

    setConfig(projectConfig){
        this.#name = projectConfig.main.task
        this.#projectConfig = projectConfig
        this.#conf = projectConfig?.Task || {}
    }

    setStorage(storage){
        this.#storage = storage
    }

    setDriver(driver){
        this.#driver = driver
    }
    
    setCustom(custom){
        this.#custom = custom
    }

    async init(){}
    async runTest(){}

    async loadState(){}

    async runBefore(){
    
    }
    async run(){}
    async saveContext(){}
    async recover(){}
    async reset(){}
    async clear(){}

    getPath(name){
        return Project.getPath(this.projectName, name)
    }

    getResource(name, type="json"){
        return path.join(this.getPath('task_file'),`${name}.${type}`)
    }

    checkNeedStop(){

    }
    get conf(){
        return this.#conf
    }
    get projectConfig(){
        return this.#projectConfig
    }
    get custom(){
        return this.#custom
    }
    set custom(v){
        this.#custom = v
    }
    get driver(){
        return this.#driver
    }
    set driver(v){
        this.#driver = v
    }
    get storage(){
        return this.#storage
    }
    set storage(v){
        this.#storage = v
    }
    get projectName(){
        return this.#projectConfig?.main.name
    }
    get name(){
        return this.#name
    }
}

module.exports = Task
