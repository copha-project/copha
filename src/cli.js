const path = require('path')
const pidusage = require('pidusage')
const os = require('os')
const Core = require('./core')
const RootPath = path.resolve(__dirname, '../')
const Base = require('./class/base')
const Utils = require('uni-utils')

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
    listTask = async () => {
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
    deleteTask = async (name) => {
        try {
            await this.core.deleteTask(name)
            this.log.info(`task delete success.`)
        } catch (e) {
            this.log.err(e.message)
        }
    }
    runTask = async (name, options) => {
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
    stopTask = async (name, options) => {
        name = await this.core.getTaskName(name)
        this.log.info(`Task [${name}] ready to stop`)
        await this.core.stopTask(name)
        if (options.restart) {
            this.log.info(`Task [${name}] ready to restart`)
            await this.core.restartTask(name)
        }
    }
    resetTask = async (name, options) => {
        try {
            await this.core.resetTask(name, options)
        } catch (error) {
            this.log.err(`ResetTask err: ${error.message}`)
        }
    }
    exportTaskData = async (name) => {
        console.log(`${name} task ready to export data`)
        try {
            await this.core.exportTaskData(name)
        } catch (e) {
            console.log(e.message)
        }
    }
    setConfig = async (name, options) => {
        let configPath = this.getPathFor('AppConfigPath')
        // open or edit task config if has task name
        if (name) {
            const task = await this.core.getTask(name)
            if (!task) return
            configPath = task.conf.main.configPath
            if (options.set) {
                return this.core.setTaskConfig(name, options.set)
            }
            if (options.custom) {
                configPath = task.getPath('customExecCode')
            }
            if (options.overwrite) {
                configPath = task.getPath('overwriteCode')
            }
            if (options.exportData) {
                configPath = task.getPath('customExportData')
            }
        }
        const child = require('child_process').spawn('atom', [configPath], {
            stdio: 'inherit'
        })
        child.on('exit', function() {
            console.log("open config success.")
        })
    }
    createTask = async (name) => {
        this.log.info(`creatre new task named ${name}`)
        await this.core.checkName(name)
        await this.core.createTask(name)
    }
    checkRun = async () => {
        let stat = await Core.checkDataPath()
        // 无参数命令显示帮助内容
        if (process.argv.length === 2) {
            stat = true
        }
        if (process.argv.length == 3 && ['config', '--help', '-h'].includes(process.argv[2])) {
            stat = true
        }
        if (stat !== true) {
            this.log.err(stat)
        }
        return stat === true
    }
    server = async (options) => {
        const Server = require('./server')
        const server = new Server()
        server.launch()
    }
}

module.exports = Cli
