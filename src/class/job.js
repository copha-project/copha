const path = require('path')
const Base = require('./base')
const Task = require('./task')

class Job extends Base {
    // job name
    #name = null
    #storage = null
    #driver = null
    #custom = null
    #taskConf = null
    #conf = null
    constructor(name,taskConf) {
        super()
        this.#name = name
        this.#taskConf = taskConf
        this.#conf = taskConf?.Job || {}
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
    // default open blank page.
    async runBefore(){
        return this.driver.open()
    }
    async run(){}
    async saveContext(){}
    async recover(){}
    async reset(){}
    async clear(){}

    getPath(name){
        return Task.getPath(this.taskName,name)
    }
    getJobFile(name){
        return path.join(this.getPath('job_file'),name)
    }
    checkNeedStop(){

    }
    get conf(){
        return this.#conf
    }
    get taskConf(){
        return this.#taskConf
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
    get taskName(){
        return this.#taskConf?.main.name
    }
    get name(){
        return this.#name
    }
}

module.exports = Job
