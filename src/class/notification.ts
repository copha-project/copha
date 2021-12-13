import Base from './base'

export default class Notification extends Base {
    private _projectConfig = null
    private _config = null
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
    
    setConfig(projectConfig){
        this._projectConfig = projectConfig
        this._config = projectConfig?.Storage || {}
    }

    async init(){}
    
    async send(msg: string){}
}