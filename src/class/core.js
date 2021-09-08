const path = require('path')
const Utils = require('uni-utils')
const Task = require('./task')
const Base = require('./base')

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

    async listType(){
        // TODO: 需要把 job list map table 存在 用户配置目录里，然后从里面读
        return this.taskTypeList
    }

    async getTaskName(data){
        if(parseInt(data, 10)>=0){
            return (await this.listTask())[data].name
        }
        return data
    }

    async createTask(name,type){
        // TODO: check type
        if(!this.taskTypeList[type]) {
            throw new Error('the type can\'t be use.')
        }
        this.log.info(`Type of ${type} task [${name}] prepare to init`)
        // 复制项目模板文件到新的任务目录
        try {
            await this.#genTpl(name,type)
        } catch (e) {
            await this.deleteTask(name)
            throw new Error(e)
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
        const taskConfigPath = Task.getPath(name,'config')
        if(!name || await Utils.checkFile(taskConfigPath) !== true){
            throw new Error(`Task [${name}] not exist`)
        }
        let taskConf
        try {
            taskConf = await Utils.readJson(taskConfigPath)
        } catch (error) {
            this.log.err(`No task config to use! ${error}`)
            throw new Error(`No task config to use! ${error}`)
        }
        const task = new Task(taskConf)
        task.core = this
        return task
    }
    async setTaskConfig(name,data){
        const task = await this.getTask(name)
        const kv = data.split('=')
        if(kv.length!=2) {
            this.log.err('The data was formatted incorrectly')
            return
        }
        return task.updateConf(kv)
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

    async getTaskConf(name){
        return Utils.readJson(Task.getPath(name,'config'))
    }
    async saveTaskConf(name, config){
        return Utils.saveFile(JSON.stringify(config, null, 4), Task.getPath(name,'config'))
    }

    async #genTpl(name,job) {
        const jobName = this.taskTypeList[job]
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
            Task.getPath(name,'task_state')
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
        // await Utils.saveFile('1', Task.getPath(name,'last_page'))
        // await Utils.saveFile('[]', Task.getPath(name,'rework_pages'))

        // copy job
        await Utils.copyDir(
            path.resolve(this.constData.AppUserJobsDir,jobName),
            path.resolve(Task.getPath(name,'root_dir'),'job')
        )

        const taskConf = await this.getTaskConf(name)
        taskConf.main.name = name
        taskConf.main.type = job
        taskConf.main.dataPath = Task.getPath(name,'data_dir')
        taskConf.main.createTime = Utils.getTodayDate()

        taskConf.Job = require(path.resolve(this.constData.AppUserJobsDir,jobName,'config.json'))
        await this.saveTaskConf(name, taskConf)
    }
    get taskTypeList(){
        return this.constData.AppTaskTypeMap
    }
}

module.exports = Core
