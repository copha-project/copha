const path = require('path')
const pkg = require('../package')
const Utils = require('uni-utils')
const Task = require('./task')
const Base = require('./class/base')
class Core extends Base{
    static instance = null
    constructor(){
        super()
        process.title = pkg.name
    }
    static getInstance(){
        if(!Core.instance){
            Core.instance = new Core()
        }
        return Core.instance
    }
    static async checkDataPath (){
        let stat = true
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
        return stat
    }

    async getTaskName(data){
        if(parseInt(data, 10)>=0){
            return (await this.listTask())[data].name
        }
        return data
    }
    async createTask(name){
        this.log.info(`Task [${name}] init`)
        // 复制项目模板文件到新的任务目录
        try {
            await this.#genTpl(name)
        } catch (e) {
            await this.deleteTask(name)
            console.log(e);
            throw new Error(e)
        }
        this.log.info(`Task [${name}] created successfully!`)
    }
    async checkName(name){
        const taskRootPath = this.#getTaskRootPath(name)
        if(name && await Utils.fileExist(taskRootPath)){
            throw new Error(`Task [${name}] exist!`)
        }
    }
    async deleteTask(name){
        const taskPath = this.#getTaskRootPath(name)
        // 删除数据文件
        await Utils.rm(taskPath)
    }
    async getTask(name){
        const taskConfigPath = this.#getTaskConfPath(name)
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
        return new Task(taskConf)
    }
    async setTaskConfig(name,data){
        const task = await this.getTask(name)
        const kv = data.split('=')
        if(kv.length!=2) {
            this.log.err('config data is a error format');
            return
        }
        switch (kv[0]) {
            case 'p':
                return task.setPage(kv[1])
            default:
                break;
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
    async listTask (){
        const files = await Utils.readDir(this.appSettings.DataPath)
        const data = await Promise.all(files.filter(e=>!e.startsWith('.')).map(async name=>{
            return (await Utils.readJson(this.#getTaskConfPath(name))).main
        }))
        return  data
    }

    async #genTpl(name) {
        const taskRootPath = this.#getTaskRootPath(name)
        const taskConfigPath = this.#getTaskConfPath(name)
        // TODO: 集中管理任务相关名字常量
        await Utils.createDir([
            taskRootPath,
            path.join(taskRootPath, 'config'),
            path.join(taskRootPath, 'data'),
            path.join(taskRootPath, 'data/download'),
            path.join(taskRootPath, 'data/page'),
            path.join(taskRootPath, 'data/detail'),
            path.join(taskRootPath, 'data/export'),
            path.join(taskRootPath, 'log'),
        ])
        await Utils.copyFile(
            this.AppConfigTpl.configPath,
            taskConfigPath
            )
        await Utils.copyFile(
            this.AppConfigTpl.statePath,
            Task.getPath(name,'task_state')
        )
        await Utils.copyFile(
            this.AppConfigTpl.custom_export_data,
            Task.getPath(name,'custom_export_data')
        )
        await Utils.copyFile(
            this.AppConfigTpl.custom_over_write_code,
            Task.getPath(name,'custom_over_write_code')
        )
        await Utils.copyFile(
            this.AppConfigTpl.custom_exec_code,
            Task.getPath(name,'custom_exec_code')
        )
        await Utils.saveFile('1', Task.getPath(name,'last_page'))
        await Utils.saveFile('[]', Task.getPath(name,'rework_pages'))
        try {
            const taskConf = await Utils.readJson(taskConfigPath)
            taskConf.main.name = name
            taskConf.main.configPath = taskConfigPath
            taskConf.main.rootPath = taskRootPath
            taskConf.main.dataPath = Task.getPath(name,'data')
            taskConf.main.createTime = new Date()
            await Utils.saveFile(JSON.stringify(taskConf, null, 4), taskConfigPath)
        } catch (error) {
            this.log.err('genTpl for task err: ',error.message)
            throw(`_genTpl for task err: ${error.message}`)
        }
    }

    #getTaskConfPath(name){
        return Task.getPath(name,'config')
    }
    #getTaskRootPath(name){
        return Task.getPath(name,'root')
    }
}

module.exports = Core
