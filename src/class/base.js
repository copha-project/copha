const path = require('path')
const os = require('os')
const Utils = require('uni-utils')
const Config = require('../../config')
const Logger = require('./logger')
const Msgs = require("../resource/i18n.json")
const ConstData = require("../resource/const")

class Base {
    static appSettings = null
    static log = null
    static AppTaskPathSet = ConstData.AppTaskPathSet
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
    static getMsg(code,options){
        let text = Msgs[code || 0][0]
        if(options){
            if (text.includes('#')) {
                // TODO: 要支持多个数据替换
                text = text.replace('#',options)
            }
        }
        return text.slice(0,-3)
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
    getMsg(...p){
        return Base.getMsg(p)
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
