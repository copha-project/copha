const path = require('path')
const Utils = require('uni-utils')
const Task = require('./task')
const Base = require('./base')
const Common = require('../common.js')

class Core extends Base{
    static instance = null
    constructor(){
        super()
    }
    static getInstance(){
        if(!Core.instance){
            Core.instance = new Core()
        }
        return Core.instance
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

    // TODO: 现在是扫描数据目录获取task list，需要重构成把task信息记录在文件了里
    async listTask (){
        const files = await Utils.readDir(this.appSettings.DataPath)
        const data = await Promise.all(files.filter(e=>!e.startsWith('.')).map(async name=>{
            return (await Utils.readJson(Task.getPath(name,'config'))).main
        }))
        return data
    }

    async listJob(){
        return Utils.readJson(this.getPathFor('AppUserJobsDataPath'))
    }

    async listDriver(){
        return Utils.readJson(this.getPathFor('AppUserDriversDataPath'))
    }

    async getTaskName(data){
        if(parseInt(data, 10)>=0){
            return (await this.listTask())[data].name
        }
        return data
    }

    async createTask(name,job){
        const jobListData = await this.listJob()
        if(!job) {
            job = this.appSettings?.Job?.Default
        }else{
            if(jobListData.find(e=>e.name==job)) {

            }else{
                throw new Error(`The job: [ ${job} ] can't be use.`)
            }
        }

        this.log.info(`Type of ${job} task [${name}] prepare to init`)
        // 复制项目模板文件到新的任务目录
        try {
            await this.#genTpl(name,job)
        } catch (e) {
            await this.deleteTask(name)
            throw e
        }
        this.log.info(`Task [${name}] created successfully!`)
    }
    
    async checkName(name){
        if(name && await Utils.fileExist(Task.getPath(name,'root_dir'))){
            throw new Error(`Task [${name}] exist!`)
        }
    }
    
    async deleteTask(name){
        const taskPath = Task.getPath(name,'root_dir')
        // 删除数据文件
        await Utils.rm(taskPath)
    }
    
    async getTask(name){
        const taskConf = await this.getTaskConf(name)
        const task = new Task(taskConf)
        task.setCore(this)
        return task
    }

    async setTaskConfig(name,data){
        const task = await this.getTask(name)
        const kv = data.split('=')
        const [key,value] = kv
        if(kv.length!=2) {
            throw Error('The data was formatted incorrectly, eg: key=value')
        }

        // TODO: set value with k1.k2.k3 = value
        // if(!taskConf[key]){
        //     throw Error(`config field [ ${key} ] not existed!`)
        // }
        // taskConf[key] = value
        if(key.toLowerCase() === 'driver'){
            return this.changeTaskDriver(name,value)
        }
    }

    async stopTask(name){
        const task = await this.getTask(name)
        const pid = parseInt(await Utils.readFile(task.getPath('pid')))
        if(pid>0) {
            process.kill(pid,'SIGINT')
        }
    }
    
    async restartTask(name){
        return Utils.createProcess(this.AppExecutableCommandPath, ['run', name])
    }
    
    async resetTask(name,options){
        const task = await this.getTask(name)
        return task.reset(options)
    }

    async load(value,options){
        // local file
        if(await Utils.fileExist(value)){
            const ext = path.extname(value)
            if(!ext || ext !== '.zip'){
                throw Error('file format is invalid, support .zip only.')
            }
            console.log('file ok')
        }
        // git
        if(value.includes('http') && value.includes('github.com')){
            console.log('github ok')
        }
        // official name
        if(options.type){
            console.log(`load ${options.type} ${value}`)
        }else{
            throw Error(`you must declare type use -t option if you wan to load official resource.`)
        }
    }

    async changeTaskDriver(name, driverName){
        const taskConf = await this.getTaskConf(name)
        const drivers = await this.listDriver()
        const queryDriver = drivers.find( item => item.name === driverName)
        if(!queryDriver){
            throw Error(`The driver [ ${driverName} ] is invalid!`)
        }
        if(!queryDriver.active){
            throw Error(`The driver [ ${driverName} ] is not load, use 'copha load ${driverName} -t driver' to load it` )
        }
        const driver = await this.getDriver(driverName)
        taskConf.main.driver = driverName
        taskConf.Driver = driver.CONFIG
        return this.saveTaskConf(name, taskConf)
    }

    async getTaskConf(name){
        try {
            return Utils.readJson(Task.getPath(name,'config'))
        } catch (error) {
            throw Error(`Not find the task config! ${error}`)
        }
    }
    async saveTaskConf(name, config){
        return Utils.saveFile(JSON.stringify(config, null, 4), Task.getPath(name,'config'))
    }

    async getDriver(name){
        if(!this.appSettings.Driver.Default){
            throw 'please set Driver.Default value on app settings, you can run \`copha config\` do it.'
        }
        const driverName = name || this.appSettings.Driver.Default
        // const driverClassPath = path.resolve(Common.IsDev ? `${this.getPathFor('AppProjectRootPath')}/src/config/default` : this.getPathFor('AppConfigUserDir'),`drivers/${driverName}`)
        const driverClassPath = path.resolve(this.getPathFor('AppConfigUserDir'),`drivers/${driverName}`)
        return require(driverClassPath)
    }

    async getJob(name){
        if(!this.appSettings.Job.Default){
            throw 'please set Driver.Default value on app settings, you can run \`copha config\` do it.'
        }
        const jobName = name || this.appSettings.Job.Default
        const jobClassPath = path.resolve(this.getPathFor('AppConfigUserDir'),`jobs/${jobName}/src`)
        return require(jobClassPath)
    }

    async #genTpl(name,job) {
        const taskConfigPath = Task.getPath(name,'config')
        // TODO: 集中管理任务相关名字常量
        await Utils.createDir([
            Task.getPath(name,'root_dir'),
            Task.getPath(name,'config_dir'),
            Task.getPath(name,'data_dir'),
            Task.getPath(name,'download_dir'),
            Task.getPath(name,'page_dir'),
            Task.getPath(name,'detail_dir'),
            Task.getPath(name,'export_dir'),
            Task.getPath(name,'log_dir')
        ])
        // config file
        await Utils.copyFile(
            this.AppConfigTpl.configPath,
            taskConfigPath
            )
        // state
        await Utils.copyFile(
            this.AppConfigTpl.statePath,
            Task.getPath(name,'state')
        )
        // export data
        await Utils.copyFile(
            this.AppConfigTpl.custom_export_data,
            Task.getPath(name,'custom_export_data')
        )
        // overcode
        await Utils.copyFile(
            this.AppConfigTpl.custom_over_write_code,
            Task.getPath(name,'custom_over_write_code')
        )
        // custom code
        await Utils.copyFile(
            this.AppConfigTpl.custom_exec_code,
            Task.getPath(name,'custom_exec_code')
        )
        
        // check job tpl exist
        if(!await Utils.fileExist(path.join(this.constData.AppUserJobsDir,job,'job.json'))){
            throw Error(this.getMsg(11))
        }

        // copy job
        await Utils.copyDir(
            path.resolve(this.constData.AppUserJobsDir,job,`src/resource`),
            path.resolve(Task.getPath(name,'root_dir'),'job')
        )

        const taskConf = await this.getTaskConf(name)
        taskConf.main.name = name
        taskConf.main.job = job
        taskConf.main.dataPath = Task.getPath(name,'data_dir')
        taskConf.main.createTime = Utils.getTodayDate()

        taskConf.Job = require(path.resolve(this.constData.AppUserJobsDir,job,'src/config.json'))
        await this.saveTaskConf(name, taskConf)
    }
}

module.exports = Core
