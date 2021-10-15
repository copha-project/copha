const openInEditor = require('open-in-editor')
const pkg = require('../../package')
const commander = require('commander')
const Base = require('./base')
const Core = require('./core')

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

    static createCommander(cli) {
        const program = new commander.Command()

        program.configureHelp({
          sortSubcommands: true,
          subcommandTerm: (cmd) => cmd.name()
        })

        program.name(pkg.name)

        program
            .version(pkg.version, '-v, --version', 'output the current version')

        program.command('create <name>')
            .description('create a new task')
            .option('-j, --job <value>', 'choose a job, default with a empty job')
            .action(cli.getMethod('createTask'))

        program.command('delete <name>')
            .description('delete a task')
            .action(cli.getMethod('deleteTask'))

        program.command('run <name>')
            .description('run a task')
            .option('-e, --export', 'export data only')
            .option('-t, --test', 'custom test only')
            .option('-d, --daemon', 'run with daemon mode')
            .option('-c, --custom','run custom code after the task finished')
            .action(cli.getMethod('runTask'))

        program.command('stop <name>')
            .description('stop a task')
            .option('-r, --restart', 'stop and restart task')
            .action(cli.getMethod('stopTask'))

        program.command('reset <name>')
            .description('reset a task')
            .option('--hard', 'delete all data of task')
            .action(cli.getMethod('resetTask'))

        program.command('list')
            .description('list task info')
            .option('-t, --type <value>', 'show list info about task')
            .action(cli.getMethod('listInfo'))

        program.command('config [name]')
            .description('edit global or task config')
            .option('-s, --set <key=value>', 'set config')
            .option('-c, --custom', 'edit custom exec code')
            .option('-o, --overwrite', 'edit overwrite code of task')
            .option('-e, --export-data', 'edit custom export data code')
            .action(cli.getMethod('setConfig'))

        program.command('server')
            .description('launch a api server')
            .option('-H, --host', 'server address, default use 127.0.0.1')
            .option('-p, --port', 'server port, default use 7000')
            .option('-d, --daemon', 'run with daemon')
            .action(cli.getMethod('server'))

        program.command('load <data>')
            .description('load resource from tar, url, name')
            .addOption(new commander.Option('-t, --type <value>', 'select resource type').choices(['job', 'driver', 'storage']))
            .action(cli.getMethod('load'))

        program.command('logs [task]')
            .description('stream logs file. Default stream all logs')
            .action(cli.getMethod('logs'))

        program.command('export <task>')
            .description('export task data')
            .option('-f --save-path <path>','absolute path of saved data')
            .option('-d, --data', 'export with data dir')
            .action(cli.getMethod('export'))

        return program.parseAsync()
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
            case 'job':
                return this.listJob()
            case 'task':
                return this.listTask()
            case 'driver':
                return this.listDriver()
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

    async listJob(){
        const jobList = await this.core.listJob()
        console.log('Job List:')
        console.table(
            jobList.map(job => {
                return {
                    Name: job.name,
                    Ver: job.version,
                    Default: this.appSettings?.Job?.Default === job.name ? 'Y' : '-'
                }
            })
        )
    }

    async listDriver(){
        const driverList = await this.core.listDriver()
        console.log('Browser Driver List:')
        console.table(
            driverList.map(driver => {
                return {
                    Name: driver.name,
                    Ver: driver.version,
                    Default: this.appSettings?.Driver?.Default === driver.name ? 'Y' : '-',
                    Loaded: driver.active
                }
            })
        )
    }

    @preCheck()
    async load(name, options){
        return this.core.load(name, options)
    }

    @preCheck()
    async logs(name, options){
        name = await this.core.getTaskName(name)
        return this.core.logs(name, options)
    }

    @preCheck()
    async createTask(name, {job}) {
        this.log.info(`prepare to create a new task named ${name}`)
        await this.core.checkName(name)
        return this.core.createTask(name,job)
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
            return (await this.core.getTask(name, true)).exportData()
        } else if (options.test) {
            return (await this.core.getTask(name, true)).test()
        } else if (options.custom) {
            return (await this.core.getTask(name, true)).execCode()
        } else if (options.daemon) {
            const sp = await this.core.startTaskByDaemon(name)
            this.log.info(`[${name}] is running with daemon. pid: ${sp.pid}`)
            return
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
        return (await this.core.getTask(name, true)).start()
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
            throw error
        })?.open(configPath)
    }

    @preCheck()
    async server(options) {
        const Server = require('./server')
        const server = new Server()
        server.launch()
    }

    @preCheck()
    async export(name, options){
        name = await this.core.getTaskName(name)
        const exportFile = await this.core.exportTask(name,options)
        this.log.info(`export data at : ${exportFile}`)
    }

    // get method bind this
    getMethod(name){
        return this[name].bind(this)
    }
}


module.exports = Cli
