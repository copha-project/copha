const Base = require('./base')
const Task = require('./task')

class Job extends Base {
    #storage = null
    #driver = null
    #custom = null
    #conf = null

    constructor(taskConf) {
        super()
        this.#conf = taskConf
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
    async run(){}
    async saveContext(){}
    async recover(){}
    async reset(){}
    async clear(){}

    getPath(name){
        return Task.getTask(this.taskName,name)
    }

    checkNeedStop(){

    }
    get conf(){
        return this.#conf
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
        return this.taskConf?.main.name
    }
}

module.exports = Job
