const path = require('path')
const pkg = require('../package')
const Utils = require('uni-utils')
const RootPath = path.resolve(__dirname, '../')
const Config = require('../config')
const Task = require('./task')
const Base = require('./class/base');
class Core extends Base{
    static instance = null
    constructor(){
        super()
        process.title = pkg.name
        this.config = Config
        this.coreConfPath = path.join(RootPath, 'config/default.json')
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
    async setConfig(conf={}){
        return Utils.saveJson(conf, this.coreConfPath)
    }
    async getConfig(){
        return Utils.readJson(this.coreConfPath)
    }
    async createTask(name){
        this.log.info(`Task [${name}] init ...`)
        // 复制项目模板文件到新的任务目录
        try {
            await this._genTpl(name)
        } catch (e) {
            await this.deleteTask(name)
            throw(e)
        }
        this.log.info(`Task [${name}] created successfully!`)
    }
    async checkName(name){
        const taskRootPath = await this._getTaskRootPath(name)
        if(name && await Utils.fileExist(taskRootPath)){
            throw(Error(`Task [${name}] exist!`))
        }
    }
    async deleteTask(name){
        const taskPath = await this._getTaskRootPath(name)
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
    async exportTaskData(name){
        const task = await this.getTask(name)
        if (task) await task.exportData()
    }
    async execCode(name){
        try {
            const task = await this.getTask(name)
            await task.execCode()
        } catch (e) {
            this.log.err('Task execCode err: ', e.message)
        }
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
                return this._setTaskPage(task, kv[1])
            default:
                break;
        }
    }
    async runTaskTest(name) {
        try {
            const task = await this.getTask(name)
            await task.test()
        } catch (e) {
            this.log.err(e.message)
        }
    }
    async runTask(name){
        try {
            const task = await this.getTask(name)
            await task.start()
        } catch (e) {
            this.log.err('Task run err: ', e.message)
        }
    }
    async stopTask(name){
        const pid = await Utils.readFile(path.join(await this._getTaskRootPath(name),'task.pid'))
        process.kill(parseInt(pid),'SIGINT')
    }
    async restartTask(name){
        await this.stopTask(name)
        return Utils.createProcess(path.resolve(RootPath, './bin/index.js'), ['run', name])
    }
    async resetTask(name,options){
        const task = await this.getTask(name)
        if (!task) return false
        // last_page.txt set 1
        await this._setTaskPage(task,1)
        // reworks pages set []
        await this._clearTaskReworkPages(task)
        // delete log
        await this._deleteTaskLog(task)
        // task.pid set ''
        await this._clearTaskPid(task)
        // task_state.json set init
        await this._clearTaskState(task)
        // delete data of cache
        if(options.hard){
            await this._deleteTaskData(task)
        }
    }
    async listTask (){
        const files = await Utils.readDir(Config.DataPath)
        const data = await Promise.all(files.filter(e=>!e.startsWith('.')).map(async name=>{
            return (await Utils.readJson(this.#getTaskConfPath(name))).main
        }))
        return  data
    }
    async _setTaskPage(task, page) {
        return Utils.saveFile(`${page}`, task.lastPageFile)
    }
    async _deleteTaskLog(task) {
        await Utils.rm(task.infoLogPath)
        await Utils.rm(task.errLogPath)
    }
    async _deleteTaskData(task) {
        await Utils.rm(`${task.saveDetailDataDir}/*`)
    }
    async _clearTaskPid(task) {
        return Utils.saveFile('', task.taskPidPath)
    }
    async _clearTaskReworkPages(task){
        return Utils.saveFile('[]', task.reworkPagesFile)
    }
    async _clearTaskState(task){
        const state = await Utils.readJson(task.statePath)
        state.RestartCount = 0
        return Utils.saveJson(state,task.statePath)
    }
    async _genTpl(name) {
        const taskRootPath = await this._getTaskRootPath(name)
        const taskConfigPath = this.#getTaskConfPath(name)
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
            path.resolve(RootPath, 'config/task.conf.tpl.json'),
            taskConfigPath
            )
        await Utils.copyFile(
            path.resolve(RootPath, 'config/task_state.json'),
            path.join(taskRootPath, 'task_state.json')
        )
        await Utils.copyFile(
            path.resolve(RootPath, 'config/custom_export_data.js'),
            path.join(taskRootPath, 'custom_export_data.js')
        )
        await Utils.copyFile(
            path.resolve(RootPath, 'config/custom_over_write_code.js'),
            path.join(taskRootPath, 'custom_over_write_code.js')
        )
        await Utils.copyFile(
            path.resolve(RootPath, 'config/custom_exec_code.js'),
            path.join(taskRootPath, 'custom_exec_code.js')
        )
        await Utils.saveFile('1', path.join(taskRootPath, 'last_page.txt'))
        await Utils.saveFile('[]', path.join(taskRootPath, 'rework_pages.json'))
        try {
            const taskConf = await Utils.readJson(taskConfigPath)
            taskConf.main.name = name
            taskConf.main.configPath = taskConfigPath
            taskConf.main.rootPath = taskRootPath
            taskConf.main.dataPath = path.join(taskRootPath, 'data')
            await Utils.saveFile(JSON.stringify(taskConf, null, 4), taskConfigPath)
        } catch (error) {
            this.log.err('genTpl for task err: ',error.message)
            throw(`_genTpl for task err: ${error.message}`)
        }
    }
    #getTaskConfPath(name){
        return path.join(this.#getTaskRootPath(name), 'config/config.json')
    }
    #getTaskRootPath(name){
        return path.resolve(this.appSettings.DataPath, name)
    }
}

module.exports = Core
