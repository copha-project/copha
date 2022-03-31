import path from 'path'
import os from 'os'
import Utils from 'uni-utils'
import Project, { getProject } from './project'
import Base from './base'
import Common from '../common'
import { getModuleManager } from './moduleManager'

export default class Core extends Base{
    private modulesHub: RemoteModule[]
    private moduleManager = getModuleManager()
    constructor(){
        super()
    }

    static async preCheck(){
        await this.rootDataPathAvailabilityCheck()
    }

    static async rootDataPathAvailabilityCheck(){
        let stat = ""
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
        if(stat !== ""){
            throw new Error(stat.toString())
        }
    }

    // task
    // TODO: 现在是扫描数据目录获取project list，需要重构成把project信息记录在文件了里
    async listProject(): Promise<ProjectConfig[]> {
        const files = await Utils.readDir(this.appSettings.DataPath)
        return Promise.all(files.filter(e=>!e.startsWith('.')).map(name=>{
            return Utils.readJson(Project.getPath(name,'config'))
        }))
    }

    async listTask(){
        return this.moduleManager.getTaskList()
    }
    
    async listModule(){
        return this.moduleManager.modules
    }

    async defaultTask() {
        return this.moduleManager.getDefaultTask()
    }

    async getProjectName(data){
        if(parseInt(data, 10)>=0){
            const projects = await this.listProject()
            if(!projects[data]){
                throw Error(this.getMsg(14 ))
            }
            return projects[data].Name
        }
        return data
    }

    async createProject(name, task:string){
        const taskListData = await this.listTask()
        if(!task) {
            const defaultTask = taskListData.find(e=>e.default)
            if(!defaultTask) throw new Error('not find default task module!')
            if(!defaultTask.active) throw new Error('default task module is inactive!')
            task = defaultTask.name
        }else{
            if(taskListData.find(e => e.name === task)) {
                this.log.info(`use task module : ${task}`)
            }else{
                throw new Error(this.getMsg(24, task))
            }
        }

        this.log.info(this.getMsg(25, name))
        // 复制项目模板文件到新的任务目录
        try {
            await this.genTpl(name,task)
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

    async getProject(name: string){
        const projectConfig = await this.getProjectConf(name)
        return getProject(projectConfig, this)
    }

    // async setProjectConfig(name,data){
    //     await this.getProject(name)
    //     const kv = data.split('=')
    //     const [key,value] = kv
    //     if(kv.length!=2) {
    //         throw Error(this.getMsg(28))
    //     }

    //     // TODO: set value with k1.k2.k3 = value
    //     // if(!projectConfig[key]){
    //     //     throw Error(`config field [ ${key} ] not existed!`)
    //     // }
    //     // projectConfig[key] = value
    //     if(key.toLowerCase() === 'driver'){
    //         return this.changeProjectDriver(name,value)
    //     }
    // }

    async stopProject(name){
        const project = await this.getProject(name)
        const pid = parseInt(await Utils.readFile(project.getPath('pid')))
        if(pid>0) {
            process.kill(pid,'SIGINT')
        }
    }

    async restartProject(name){
        return Utils.createProcess(this.constData.AppExecutableCommandPath, ['run', name])
    }

    async resetProject(name,options){
        const project = await this.getProject(name)
        return project.reset(options)
    }

    async load(value: string|undefined){
        if(value == undefined){
            // load all module
            for (const module of this.moduleManager.modules) {
                this.log.info(`Check module info: [${module.name}]: ${module.active?'Ready':'No Ready'}`)
                if(!module.active){
                    this.log.info(`Module: [${module.name}] is ready to use.`)
                }else{
                    await this.loadModule(module)
                }
                this.log.info("\n")
            }
        }else{
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
        }
    }

    async logs(name, options){
        const project = await this.getProject(name)
        this.log.stream(project.getPath('info_log'), options)
    }

    async exportProject(name, options){
        this.log.info(`start export project ${name},; ${options.data}`)
        const project = await this.getProject(name)
        //todo support declare save path and exclude data dir
        const exportFile = options?.savePath || this.getExportFileName(project.name)
        await Common.zipDir(project.getPath('root_dir'),exportFile)
        return exportFile
    }

    async changeProjectDriver(name, driverName){
        const projectConfig = await this.getProjectConf(name)
        const queryDriver = await this.getModuleInfo(driverName)
        if(!queryDriver.active){
            throw new Error(this.getMsg(35,driverName,driverName))
        }
        const driver = await this.getModule(driverName)
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

    async getModule(name:string) {
        return require(path.resolve(this.constData.AppModulesDir,name))
    }

    async getModuleInfo(name:string) {
        return this.moduleManager.getDefaultModuleByName(name)
    }

    // other
    async startProjectByDaemon(name){
        await this.getProject(name)
        return Utils.createProcess(this.constData.AppExecutableCommandPath,['run',name])
    }

    private async genTpl(name, taskName) {
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
            this.constData.AppConfigTpl.configPath,
            projectConfigPath
            )
        // state
        await Utils.copyFile(
            this.constData.AppConfigTpl.statePath,
            Project.getPath(name,'state')
        )
        // export data
        await Utils.copyFile(
            this.constData.AppConfigTpl.custom_export_data,
            Project.getPath(name,'custom_export_data')
        )
        // overcode
        await Utils.copyFile(
            this.constData.AppConfigTpl.custom_over_write_code,
            Project.getPath(name,'custom_over_write_code')
        )
        // custom code
        await Utils.copyFile(
            this.constData.AppConfigTpl.custom_exec_code,
            Project.getPath(name,'custom_exec_code')
        )

        // check task tpl exist
        if(!await Utils.fileExist(path.join(this.constData.AppModulesDir, taskName,'package.json'))){
            throw new Error(this.getMsg(11))
        }

        // copy task
        await Utils.copyDir(
            path.resolve(this.constData.AppModulesDir, taskName ,`src/resource`),
            path.resolve(Project.getPath(name,'root_dir'),'task')
        )

        const projectConfig = await this.getProjectConf(name)
        projectConfig.main.name = name
        projectConfig.main.task = taskName
        projectConfig.main.dataPath = Project.getPath(name,'data_dir')
        projectConfig.main.createTime = Utils.getTodayDate()

        projectConfig.Task = require(path.resolve(this.constData.AppModulesDir, taskName,'src/config.json'))
        await this.saveProjectConf(name, projectConfig)
    }

    private getExportFileName(name){
        return path.join(os.tmpdir(),`copha_project_${name}_export_data.zip`)
    }

    private async loadModule(module: Module){
        this.log.info(`Start load module: [${module.name}]`)   
        const remoteModule = this.modulesHub.find(e=>e.name == module.name)
        if(remoteModule == undefined){
            this.log.err('not find module info from module hub.')
        }else{
            this.log.debug(remoteModule.repository)
        }
    }

    // private async getModulesHub(){
    //     this.log.debug(`fetch modules info from : ${this.appSettings.HubDomain}`)
    //     const listData = await Utils.download(this.appSettings.HubDomain)
    //     this.modulesHub = JSON.parse(listData)
    // }
}