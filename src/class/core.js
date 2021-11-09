const path = require('path')
const os = require('os')
const Utils = require('uni-utils')
const Project = require('./project')
const Base = require('./base')
const Common = require('../common.js')
const Proxy = require('./proxy')

class Core extends Base{
    static #instance = null
    constructor(){
        super()
    }

    static getInstance(){
        if(!this.#instance){
            this.#instance = new this()
            this.#instance.proxy = Proxy.getInstance()
        }
        return this.#instance
    }

    static async preCheck(){
        await this.rootDataPathAvailabilityCheck()
    }

    static async rootDataPathAvailabilityCheck(){
        let stat = true
        try {
            if (this.appSettings.DataPath === '') {
                stat = this.getMsg(1)
            } else {
                if (!path.isAbsolute(this.appSettings.DataPath)) {
                    stat = this.getMsg(2)
                } else {
                    if (await Utils.checkFile(this.appSettings.DataPath) !== true) {
                        stat = this.getMsg(3)
                    }
                }
            }
        } catch (e) {
            stat = e.message
        }
        if(stat !== true){
            throw new Error(stat)
        }
    }

    async getProxy(...args){
        return this.proxy.getProxy(...args)
    }

    // TODO: 现在是扫描数据目录获取project list，需要重构成把project信息记录在文件了里
    async listProject (){
        const files = await Utils.readDir(this.appSettings.DataPath)
        const data = await Promise.all(files.filter(e=>!e.startsWith('.')).map(async name=>{
            return (await Utils.readJson(Project.getPath(name,'config'))).main
        }))
        return data
    }

    async listTask(){
        return Utils.readJson(this.constData.AppUserTasksDataPath)
    }

    async listDriver(){
        return Utils.readJson(this.constData.AppUserDriversDataPath)
    }

    async getProjectName(data){
        if(parseInt(data, 10)>=0){
            const projects = await this.listProject()
            if(!projects[data]){
                throw Error(this.getMsg(14 ))
            }
            return projects[data].name
        }
        return data
    }

    async createProject(name,task){
        const taskListData = await this.listTask()
        if(!task) {
            task = this.appSettings?.Task?.Default
        }else{
            if(taskListData.find(e=>e.name==task)) {

            }else{
                throw new Error(this.getMsg(24, task))
            }
        }

        this.log.info(this.getMsg(25, task, name))
        // 复制项目模板文件到新的任务目录
        try {
            await this.#genTpl(name,task)
        } catch (e) {
            await this.deleteProject(name)
            throw e
        }
        this.log.info(this.getMsg(26, name))
    }

    async checkName(name){
        if(name && await Utils.fileExist(Project.getPath(name,'root_dir'))){
            throw new Error(this.getMsg(27, name))
        }
    }

    async deleteProject(name){
        const projectPath = Project.getPath(name,'root_dir')
        // 删除数据文件
        await Utils.rm(projectPath)
    }

    async getProject(name, singleton = false){
        const projectConfig = await this.getProjectConf(name)
        const project = singleton ? await Project.getInstance(this, projectConfig) : new Project(projectConfig)
        return project
    }

    async setProjectConfig(name,data){
        await this.getProject(name)
        const kv = data.split('=')
        const [key,value] = kv
        if(kv.length!=2) {
            throw Error(this.getMsg(28))
        }

        // TODO: set value with k1.k2.k3 = value
        // if(!projectConfig[key]){
        //     throw Error(`config field [ ${key} ] not existed!`)
        // }
        // projectConfig[key] = value
        if(key.toLowerCase() === 'driver'){
            return this.changeProjectDriver(name,value)
        }
    }

    async stopProject(name){
        const project = await this.getProject(name)
        const pid = parseInt(await Utils.readFile(project.getPath('pid')))
        if(pid>0) {
            process.kill(pid,'SIGINT')
        }
    }

    async restartProject(name){
        return Utils.createProcess(this.AppExecutableCommandPath, ['run', name])
    }

    async resetProject(name,options){
        const project = await this.getProject(name)
        return project.reset(options)
    }

    async load(value, options){
        // local file
        if(await Utils.fileExist(value)){
            const ext = path.extname(value)
            if(!ext || ext !== '.zip'){
                throw Error(this.getMsg(29))
            }
            console.log('file ok')
        }
        // git
        if(value.includes('http') && value.includes('github.com')){
            console.log('github ok')
        }
        // official name
        if(options.type){
            console.log(`start load ${options.type} ${value}`)
        }else{
            throw Error(this.getMsg(30))
        }
    }

    async logs(name, options){
        const project = await this.getProject(name)
        this.log.stream(project.getPath('info_log'))
    }

    async exportProject(name, options){
        this.log.info(`start export project ${name},; ${options.data}`)
        const project = await this.getProject(name)
        //todo support declare save path and exclude data dir
        const exportFile = options?.savePath || this.#getExportFileName(project.name)
        await Common.zipDir(project.getPath('root_dir'),exportFile)
        return exportFile
    }

    async changeProjectDriver(name, driverName){
        const projectConfig = await this.getProjectConf(name)
        const drivers = await this.listDriver()
        const queryDriver = drivers.find( item => item.name === driverName)
        if(!queryDriver){
            throw new Error(this.getMsg(34,driverName))
        }
        if(!queryDriver.active){
            throw new Error(this.getMsg(35,driverName,driverName))
        }
        const driver = await this.getDriver(driverName)
        projectConfig.main.driver = driverName
        projectConfig.Driver = driver.CONFIG
        return this.saveProjectConf(name, projectConfig)
    }

    async getProjectConf(name){
        try {
            return await Utils.readJson(Project.getPath(name,'config'))
        } catch (error) {
            this.log.err(`${error.message}`)
            throw Error(`Not find the project config!`)
        }
    }

    async saveProjectConf(name, config){
        return Utils.saveFile(JSON.stringify(config, null, 4), Project.getPath(name,'config'))
    }

    async getStorage(name){
        if(!name) throw new Error(this.getMsg(39))
        const storage = this.appSettings?.Storage?.List.find(e=>e.name===name)
        if(!storage){
            throw new Error(this.getMsg(36,name,this.constData.DocsLinks.StorageHelpLink))
        }
        const storageClassPath = path.resolve(this.constData.AppConfigUserDir,`storages/${storage.name}`)
        return require(storageClassPath)
    }

    async getDriver(name){
        if(!this.appSettings.Driver.Default){
            throw new Error(this.getMsg(37))
        }
        const driverName = name || this.appSettings.Driver.Default
        const driverClassPath = path.resolve(this.constData.AppConfigUserDir,`drivers/${driverName}`)
        return require(driverClassPath)
    }

    async getTask(name){
        if(!this.appSettings.Task.Default){
            throw 'please set Driver.Default value on app settings, you can run \`copha config\` do it.'
        }
        const taskName = name || this.appSettings.Task.Default
        const taskClassPath = path.resolve(this.constData.AppConfigUserDir,`tasks/${taskName}/src`)
        return require(taskClassPath)
    }

    async startProjectByDaemon(name){
        await this.getProject(name)
        return Utils.createProcess(this.constData.AppExecutableCommandPath,['run',name])
    }

    async #genTpl(name, task) {
        const projectConfigPath = Project.getPath(name,'config')
        // TODO: 集中管理任务相关名字常量
        await Utils.createDir([
            Project.getPath(name,'root_dir'),
            Project.getPath(name,'config_dir'),
            Project.getPath(name,'data_dir'),
            Project.getPath(name,'download_dir'),
            Project.getPath(name,'page_dir'),
            Project.getPath(name,'detail_dir'),
            Project.getPath(name,'export_dir'),
            Project.getPath(name,'log_dir')
        ])
        // config file
        await Utils.copyFile(
            this.AppConfigTpl.configPath,
            projectConfigPath
            )
        // state
        await Utils.copyFile(
            this.AppConfigTpl.statePath,
            Project.getPath(name,'state')
        )
        // export data
        await Utils.copyFile(
            this.AppConfigTpl.custom_export_data,
            Project.getPath(name,'custom_export_data')
        )
        // overcode
        await Utils.copyFile(
            this.AppConfigTpl.custom_over_write_code,
            Project.getPath(name,'custom_over_write_code')
        )
        // custom code
        await Utils.copyFile(
            this.AppConfigTpl.custom_exec_code,
            Project.getPath(name,'custom_exec_code')
        )

        // check task tpl exist
        if(!await Utils.fileExist(path.join(this.constData.AppUserTasksDir, task,'package.json'))){
            throw new Error(this.getMsg(11))
        }

        // copy task
        await Utils.copyDir(
            path.resolve(this.constData.AppUserTasksDir, task ,`src/resource`),
            path.resolve(Project.getPath(name,'root_dir'),'task')
        )

        const projectConfig = await this.getProjectConf(name)
        projectConfig.main.name = name
        projectConfig.main.task = task
        projectConfig.main.dataPath = Project.getPath(name,'data_dir')
        projectConfig.main.createTime = Utils.getTodayDate()

        projectConfig.Task = require(path.resolve(this.constData.AppUserTasksDir, task,'src/config.json'))
        await this.saveProjectConf(name, projectConfig)
    }

    #getExportFileName(name){
        return path.join(os.tmpdir(),`copha_project_${name}_export_data.zip`)
    }
}

module.exports = Core
