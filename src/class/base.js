const path = require('path')
const os = require('os')
const commandExists = require('command-exists')
const Utils = require('uni-utils')
const Logger = require('./logger')
const Msgs = require("../resource/i18n.json")
const ConstData = require("../resource/const")

class Base {
    static appSettings = null
    static constData = ConstData
    static log = new Logger()
    static AppTaskPathSet = ConstData.AppTaskPathSet
    constructor() {
        this.#initValues()
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
        try {
            await Utils.copyDir(this.constData.AppDefaultConfigDir,this.constData.AppConfigUserDir)
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
    get constData(){
        return Base.constData
    }
    get log(){
        return Base.log
    }
    setLog(conf){
        Base.log = new Logger(conf)
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
            try {
                return await commandExists(cmd)
            } catch {
                continue
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
