const Base = require('./base')

class Storage extends Base {
    db = null
    private _projectConfig = null
    private _config = null
    constructor() {
        super()
    }
    get conf(){
        return this._config
    }
    get projectConfig(){
        return this._projectConfig
    }

    setConfig(projectConfig){
        this._projectConfig = projectConfig
        this._config = projectConfig?.Storage || {}
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

export {
    Storage
}