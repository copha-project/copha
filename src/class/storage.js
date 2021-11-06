const Base = require('./base')

class Storage extends Base {
    db = null
    #taskConf = null
    #conf = null
    constructor(taskConf) {
        super()
        this.#taskConf = taskConf
        this.#conf = taskConf?.Storage || {}
        this.storageType = taskConf?.Storage?.Name
    }
    get conf(){
        return this.#conf
    }
    get taskConf(){
        return this.#taskConf
    }

    async init(){}
    
    async findById(id){}

    async all(){}

    async save(data){}

    async query(where){}

    querySync(where){}

    async close(){}
}

module.exports = Storage
