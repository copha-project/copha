const Base = require('./base')
const Task = require('./task')

class Job extends Base {
    #driver = null
    #custom = null
    #taskConf = null

    constructor(taskConf) {
        super()
        this.#taskConf = taskConf
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

    get taskConf(){
        return this.#taskConf
    }
    get custom(){
        return this.#custom
    }
    get driver(){
        return this.#driver
    }
    get #taskName(){
        return this.taskConf?.main.name
    }
}

module.exports = Job
