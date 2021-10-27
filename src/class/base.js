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
        Base.log.debug(this.getMsg(31, this.constructor.name))
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

    static getMsg(code, ...replaces){
        const index = this.constData.LangList.indexOf(this.appSettings.Language)
        let text = Msgs[code][index] || Msgs[code][0]
        for (let index = 0; index < replaces.length; index++) {
            text = text.replace('#',replaces[index])
        }
        return text.replace(/\(\d*\)$/,'')
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

    static getEnv(key){
        return process.env[key]
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

    getEnv(...args){
        return Base.getEnv(...args)
    }

    async getEditor(){
        for (const cmd of [this.appSettings.Editor,...this.constData.DefaultEditorList]) {
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

        if(this.getEnv('COPHA_LANG') && this.constData.LangList.indexOf(this.getEnv('COPHA_LANG')) != -1){
            config.Language = this.getEnv('COPHA_LANG')
        }

        if(!config.Editor && this.getEnv('COPHA_EDITOR')){
            config.Editor = this.getEnv('COPHA_EDITOR')
        }

        return config
    }
}

module.exports = Base
