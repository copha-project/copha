const commandExists = require('command-exists')
const Utils = require('uni-utils')
const Logger = require('./logger')
const Msgs = require("../resource/i18n.json")
const ConstData = require("../const")
const {cp} = require('../common')

class Base {
    static appSettings = null
    static constData = ConstData
    static log = new Logger()
    static AppProjectPathSet = ConstData.AppProjectPathSet
    RootPath: string
    AppConfigPath: string
    AppExecutableCommandPath: string
    AppConfigTpl: string
    constructor() {
        this.initValues()
        this.initConfig()
        Base.log.debug(this.getMsg(31, this.constructor.name))
    }
    private initValues(){
        this.RootPath = ConstData.AppProjectRootPath
        this.AppConfigPath = ConstData.AppConfigUserPath
        this.AppExecutableCommandPath = ConstData.AppExecutableCommandPath
        this.AppConfigTpl = ConstData.AppConfigTpl
    }
    private initConfig(){
        if(!Base.appSettings){
            Base.appSettings = this.getAppSettings()
        }
    }

    static getMsg(code: number, ...replaces: string[]){
        const index = this.constData.LangList.indexOf(this.appSettings?.Language)
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
            if(process.platform === 'win32'){
                await cp(this.constData.AppDefaultConfigDir,this.constData.AppConfigUserDir)
            }else{
                await Utils.copyDir(this.constData.AppDefaultConfigDir,this.constData.AppConfigUserDir)
            }
            await Utils.saveFile("", this.constData.AppInstalledLockFile)
        } catch (e) {
            try{
                await Utils.rm(this.constData.AppConfigUserDir)
            }catch{}
            console.log(e.message)
            throw new Error(this.getMsg(8,this.constData.BugLink))
        }
    }

    static getEnv(key: string){
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

    setLog(conf: object){
        Base.log = new Logger(conf)
    }

    getMsg(index: number, ...args: string[]){
        return Base.getMsg(index, ...args)
    }

    getEnv(key: string){
        return Base.getEnv(key)
    }

    async getEditor(){
        for (const cmd of [this.appSettings.Editor,...this.constData.DefaultEditorList]) {
            try {
                if(await commandExists(cmd)) return cmd
            } catch {
                continue
            }
        }
        return ''
    }

    private getAppSettings(){
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

export {}