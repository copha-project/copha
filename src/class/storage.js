const Base = require('./base')

class Storage extends Base {
    db = null
    #projectConfig = null
    #conf = null
    constructor() {
        super()
    }
    get conf(){
        return this.#conf
    }
    get projectConfig(){
        return this.#projectConfig
    }

    setConfig(projectConfig){
        this.#projectConfig = projectConfig
        this.#conf = projectConfig?.Storage || {}
        this.storageType = projectConfig?.Storage?.Name
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
