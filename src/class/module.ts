import Base from './base'

export default class Module extends Base {
    static instance: Module

    protected typeName = ""
    private _projectConfig: ProjectConfig
    private _config: BaseObject

    constructor() {super()}

    static getInstance(){
        if(!this.instance){
            this.instance = new this()
        }
        return this.instance
    }

    setConfig(projectConfig: ProjectConfig){
        if(!this.typeName) throw Error('module meta data error')
        this._projectConfig = projectConfig
        this._config = projectConfig[this.typeName] || {}
    }

    static CONFIG = {}

    async init(){
        throw new Error(this.getMsg(10,'module async init()'))
    }

    get projectConfig(){
        return this._projectConfig
    }

    get conf(){
        return this._config
    }

    get config(){
        return this._config
    }

    get projectName(){
        return this.projectConfig?.main.name
    }
}