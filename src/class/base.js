const path = require('path')
const os = require('os')
const Utils = require('uni-utils')
const Config = require('../../config')
const Logger = require('./logger')
const Storage = require('../storage')
const Msgs = require("../resource/i18n.json")
const ConstData = require("../resource/const")

class Base {
    static storage = null
    static appSettings = null
    static log = null
    constructor(taskConf={}) {
        this.conf = taskConf
        this.#initValues()
        this.#initLogger()
        this.#initConfig()
        Base.log.debug(`Base class init for : ${new.target.name}`)
    }
    #initValues(){
        this.RootPath = path.resolve(__dirname, '../../')
        this.AppConfigPath = ConstData.AppConfigPath
        this.AppExecutableCommandPath = ConstData.AppExecutableCommandPath
        this.AppConfigTpl = ConstData.AppConfigTpl
    }
    #initConfig(){
        if(!Base.appSettings){
            Base.appSettings = this.#getAppSettings()
        }
    }
    #initLogger(){
        if(Base.log) return
        if (this.conf?.main?.rootPath){
            Base.log = new Logger({
                                    'infoPath': path.join(this.conf.main.rootPath, 'log/info.log'),
                                    'errPath': path.join(this.conf.main.rootPath, 'log/err.log')
                                })
        }else{
            Base.log = new Logger()
        }
    }
    #initStorage() {
        this.log.debug('Base: init storage')
        try {
            const storage = new Storage(this.conf.Storage)
            storage.init()
            return storage
        } catch (e) {
            this.log.err(`init storage error: ${e.message}`)
            throw new Error(`init storage error: ${e.message}`)
        }
    }
    getPathFor(key){
        return this.#pathData[key]
    }
    get #pathData(){
        return ConstData
    }
    get appSettings() {
        return Base.appSettings
    }
    get log(){
        return Base.log
    }
    get storage(){
        if(!Base.storage){
            Base.storage = this.#initStorage()
        }
        return Base.storage
    }
    getMsg(code,options){
        let text = Msgs[code || 0][0]
        if(options){
            if (text.includes('#')) {
                // TODO: 要支持多个数据替换
                text = text.replace('#',options)
            }
        }
        return text.slice(0,-3)

    }
    getEnv(key){
        return process.env[key]
    }
    #getAppSettings(){
        if(!Utils.checkFileSync(ConstData.AppConfigPath)) throw new Error(this.getMsg(4))
        const config = Utils.readJsonSync(ConstData.AppConfigPath)
        if (config?.DataPath === ""){
            if(this.getEnv('COPHA_DATA_PATH')){
                config.DataPath = this.getEnv('COPHA_DATA_PATH')
            }
        }
        return config
    }
}

module.exports = Base
