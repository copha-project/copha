import Base from './base'

class Storage extends Base {
    db = null
    private _projectConfig = null
    private _config = null
    private _storageType: string
    constructor() {
        super()
    }
    get conf(){
        return this._config
    }

    get config(){
        return this._config
    }

    get projectConfig(){
        return this._projectConfig
    }
    
    get storageType(){
        return this._storageType
    }

    setConfig(projectConfig){
        this._projectConfig = projectConfig
        this._config = projectConfig?.Storage || {}
        this._storageType = projectConfig?.Storage?.Name
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