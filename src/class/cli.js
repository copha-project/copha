const path = require('path')
const pidusage = require('pidusage')
const os = require('os')
const openInEditor = require('open-in-editor')
const Base = require('./base')
const Core = require('./core')
const Utils = require('uni-utils')

function preCheck() {
    return function(o, k, descriptor) {
        const method = descriptor.value
        descriptor.value = async function(...args) {
            await Core.preCheck()
            await method.apply(this, args)
        }
    }
}

class Cli extends Base {
    static core = null
    constructor() {
        super()
    }
    static getInstance() {
        try {
            return new Cli()
        } catch (e) {
            Base.log.err(e.message)
        }
    }

    get core() {
        if (!Cli.core) {
            Cli.core = Core.getInstance()
        }
        return Cli.core
    }

    @preCheck()
    async listInfo(options) {
        if(!options.type) return this.listTask()
        switch (options.type) {
            case 'type':
                return this.listType()
            case 'task':
                return this.listTask()
            default:
                throw new Error('unknow type of list')
        }
    }
    async listTask(){
        const tasksData = await this.core.listTask()
        console.log('Task List:')
        console.table(
            tasksData.map(task => {
                return {
                    Name: task.name,
                    Description: task.desc || '',
                    createTime: task.createTime || '-'
                }
            })
        )
    }
    async listType(){
        const typeList = await this.core.listType()
        console.log('Task Type List:')
        console.table(
            typeList.map(data => {
                return {
                    Name: data,
                    Description: ''
                }
            })
        )
    }

    @preCheck()
    async createTask(name, {type}) {
        this.log.info(`prepare to create a new task named ${name}`)
        await this.core.checkName(name)
        return this.core.createTask(name,type)
    }

    @preCheck()
    async deleteTask(name){
        name = await this.core.getTaskName(name)
        try {
            await this.core.deleteTask(name)
            this.log.info(`task delete success.`)
        } catch (e) {
            this.log.err(e)
        }
    }

    @preCheck()
    async runTask(name, options) {
        name = await this.core.getTaskName(name)
        if (options.export) {
            return (await this.core.getTask(name)).exportData()
        } else if (options.test) {
            return (await this.core.getTask(name)).test()
        } else if (options.runcode) {
            return (await this.core.getTask(name)).execCode()
        } else if (options.daemon) {
            // TODO: 重写后台运行功能
            // try {
            //     const pid = await Utils.readFile(path.join(this.core.config.DataPath, name, 'task.pid'))
            //     const pInfo = await pidusage(parseInt(pid))
            //     this.log.err(`Run Task Err: Task is running at ${pInfo.pid}`)
            // } catch (error) {
            //     this.log.info(`Task [${name}] ready to run with daemon`)
            //     return Utils.createProcess(path.resolve(__dirname, '../bin/index.js'), ['run', name])
            // }
        }
        return (await this.core.getTask(name)).start()
    }

    @preCheck()
    async stopTask(name, options) {
        name = await this.core.getTaskName(name)
        this.log.info(`Task [${name}] ready to stop`)
        await this.core.stopTask(name)
        if (options.restart) {
            this.log.info(`Task [${name}] ready to restart`)
            await this.core.restartTask(name)
        }
    }

    @preCheck()
    async resetTask(name, options) {
        name = await this.core.getTaskName(name)
        return this.core.resetTask(name, options)
    }

    async setConfig(name, options) {
        // open or edit task config if has task name
        if (name) {
            return this.setTaskConfig(name, options)
        }
        const editorBinName = await this.getEditor()
        openInEditor.configure({
            editor: editorBinName
        }, error => {
            throw new Error(error)
        })?.open(this.AppConfigPath)
    }

    @preCheck()
    async setTaskConfig(name, options) {
        let configPath = ''
        name = await this.core.getTaskName(name)
        const task = await this.core.getTask(name)
        if (!task) return
        configPath = task.getPath('config')
        if (options.set) {
            return this.core.setTaskConfig(name, options.set)
        }
        if (options.custom) {
            configPath = task.getPath('custom_exec_code')
        }
        if (options.overwrite) {
            configPath = task.getPath('custom_over_write_code')
        }
        if (options.exportData) {
            configPath = task.getPath('custom_export_data')
        }
        const editorBinName = await this.getEditor()
        openInEditor.configure({
            editor: editorBinName
        }, error => {
            throw new Error(error)
        })?.open(configPath)
    }

    @preCheck()
    async server(options) {
        const Server = require('./server')
        const server = new Server()
        server.launch()
    }

    // get method bind this
    getMethod(name){
        return this[name].bind(this)
    }
}

module.exports = Cli
