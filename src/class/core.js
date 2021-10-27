const path = require('path')
const os = require('os')
const Utils = require('uni-utils')
const Task = require('./task')
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

    // TODO: 现在是扫描数据目录获取task list，需要重构成把task信息记录在文件了里
    async listTask (){
        const files = await Utils.readDir(this.appSettings.DataPath)
        const data = await Promise.all(files.filter(e=>!e.startsWith('.')).map(async name=>{
            return (await Utils.readJson(Task.getPath(name,'config'))).main
        }))
        return data
    }

    async listJob(){
        return Utils.readJson(this.constData('AppUserJobsDataPath'))
    }

    async listDriver(){
        return Utils.readJson(this.constData('AppUserDriversDataPath'))
    }

    async getTaskName(data){
        if(parseInt(data, 10)>=0){
            const tasks = await this.listTask()
            if(!tasks[data]){
                throw Error(this.getMsg(14 ))
            }
            return tasks[data].name
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
                throw new Error(this.getMsg(24, job))
            }
        }

        this.log.info(this.getMsg(25, job, name))
        // 复制项目模板文件到新的任务目录
        try {
            await this.#genTpl(name,job)
        } catch (e) {
            await this.deleteTask(name)
            throw e
        }
        this.log.info(this.getMsg(26, name))
    }

    async checkName(name){
        if(name && await Utils.fileExist(Task.getPath(name,'root_dir'))){
            throw new Error(this.getMsg(27, name))
        }
    }

    async deleteTask(name){
        const taskPath = Task.getPath(name,'root_dir')
        // 删除数据文件
        await Utils.rm(taskPath)
    }

    async getTask(name, singleton = false){
        const taskConf = await this.getTaskConf(name)
        const task = singleton ? await Task.getInstance(this, taskConf) : new Task(taskConf)
        return task
    }

    async setTaskConfig(name,data){
        const task = await this.getTask(name)
        const kv = data.split('=')
        const [key,value] = kv
        if(kv.length!=2) {
            throw Error(this.getMsg(28))
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
            console.log(`load ${options.type} ${value}`)
        }else{
            throw Error(this.getMsg(30))
        }
    }

    async logs(name, options){
        const task = await this.getTask(name)
        this.log.stream(task.getPath('info_log'))
    }

    async exportTask(name, options){
        this.log.info(`start export task ${name},; ${options.data}`)
        const task = await this.getTask(name)
        //todo support declare save path and exclude data dir
        const exportFile = options?.savePath || this.#getExportFileName(task.name)
        await Common.zipDir(task.getPath('root_dir'),exportFile)
        return exportFile
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
            return await Utils.readJson(Task.getPath(name,'config'))
        } catch (error) {
            this.log.err(`${error.message}`)
            throw Error(`Not find the task config!`)
        }
    }

    async saveTaskConf(name, config){
        return Utils.saveFile(JSON.stringify(config, null, 4), Task.getPath(name,'config'))
    }

    async getStorage(name){
        if(!name) throw new Error(`storage named [${name}] is invalid.`)
        const storage = this.appSettings?.Storage?.List.find(e=>e.name===name)
        if(!storage){
            throw new Error(`not find storage with delare name [${name}].
            for more help, please visit the website: ${this.constData('storage_help_link')}}`)
        }
        const storageClassPath = path.resolve(this.constData('AppConfigUserDir'),`storages/${storage.name}`)
        return require(storageClassPath)
    }

    async getDriver(name){
        if(!this.appSettings.Driver.Default){
            throw 'please set Driver.Default value on app settings, you can run \`copha config\` do it.'
        }
        const driverName = name || this.appSettings.Driver.Default
        const driverClassPath = path.resolve(this.constData('AppConfigUserDir'),`drivers/${driverName}`)
        return require(driverClassPath)
    }

    async getJob(name){
        if(!this.appSettings.Job.Default){
            throw 'please set Driver.Default value on app settings, you can run \`copha config\` do it.'
        }
        const jobName = name || this.appSettings.Job.Default
        const jobClassPath = path.resolve(this.constData('AppConfigUserDir'),`jobs/${jobName}/src`)
        return require(jobClassPath)
    }

    async startTaskByDaemon(name){
        const task = await this.getTask(name)
        return Utils.createProcess(this.constData('AppExecutableCommandPath'),['run',name])
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

    #getExportFileName(name){
        return path.join(os.tmpdir(),`copha_task_${name}_export_data.zip`)
    }
}

module.exports = Core
