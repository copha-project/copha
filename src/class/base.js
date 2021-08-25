const path = require('path')
const os = require('os')
const commandExists = require('command-exists')
const Utils = require('uni-utils')
const Config = require('../../config')
const Logger = require('./logger')
const Msgs = require("../resource/i18n.json")
const ConstData = require("../resource/const")

class Base {
    static appSettings = null
    static constData = ConstData
    static log = new Logger()
    static AppTaskPathSet = ConstData.AppTaskPathSet
    constructor(taskConf={}) {
        this.conf = taskConf
        this.#initValues()
        this.#initLogger()
        this.#initConfig()
        Base.log.debug(`Base class init for : ${new.target.name}`)
    }
    #initValues(){
        this.RootPath = ConstData.AppProjectRootPath
        this.AppConfigPath = ConstData.AppConfigUserPath
        this.AppExecutableCommandPath = ConstData.AppExecutableCommandPath
        this.AppConfigTpl = ConstData.AppConfigTpl
    }
    #initConfig(){
        if(!Base.appSettings){
            Base.appSettings = this.#getAppSettings()
        }
    }
    #initLogger(){
        if (this.conf?.main?.rootPath){
            Base.log = new Logger({
                                    'infoPath': path.join(this.conf.main.rootPath, 'log/info.log'),
                                    'errPath': path.join(this.conf.main.rootPath, 'log/err.log')
                                })
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
    static async installCheck(){
        if(await Utils.checkFile(this.constData.AppConfigUserDir)) return true
        this.log.info(this.getMsg(9))
        await Utils.createDir(this.constData.AppConfigUserDir)
        try {
            await Utils.copyFile(this.constData.AppDefaultConfigPath, this.constData.AppConfigUserPath)
            await Utils.saveFile("", this.constData.AppInstalledLockFile)
            return true
        } catch (e) {
            await Utils.rm(this.constData.AppConfigUserDir)
            this.log.err(this.getMsg(8,this.constData.BugLink))
            this.log.err(e)
        }
        return false
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
        return Base.getMsg(...p)
    }
    getEnv(key){
        return process.env[key]
    }
    async getEditor(){
        const editorList = ['atom','vim','vi','nano']
        for (const cmd of editorList) {
            if(await commandExists(cmd)){
                return cmd
            }
        }
        return ''
    }
    #getAppSettings(){
        if(!Utils.checkFileSync(ConstData.AppConfigUserPath)) throw new Error(this.getMsg(4))
        const config = Utils.readJsonSync(ConstData.AppConfigUserPath)
        if (config?.DataPath === ""){
            if(this.getEnv('COPHA_DATA_PATH')){
                config.DataPath = this.getEnv('COPHA_DATA_PATH')
            }
        }
        return config
    }
}

module.exports = Base
