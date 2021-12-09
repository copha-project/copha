import openInEditor from 'open-in-editor'
import commander from 'commander'
import Base from './base'
import Core from './core'
import Server from './server'

function preCheck() {
    return function(o, k, descriptor) {
        const method = descriptor.value
        descriptor.value = async function(...args) {
            await Core.preCheck()
            await method.apply(this, args)
        }
    }
}

export default class Cli extends Base {
    private static instance: Cli
    private _core: Core
    constructor() { super() }

    createCommander() {
        const program = new commander.Command()

        program.configureHelp({
          sortSubcommands: true,
          subcommandTerm: (cmd) => cmd.name()
        })

        program.name(this.constData.AppInfo.name)

        program
            .version(this.constData.AppInfo.version, '-v, --version', 'output the current version')

        program.command('list')
            .description('list project info')
            .option('-a, --all','show all list data')
            .option('-t, --type <value>', 'show list info about project')
            .action(this.getMethod('listInfo'))

        program.command('create <name>')
            .description('create a new project')
            .option('-t, --task <value>', 'choose a task, default with a empty task')
            .action(this.getMethod('createProject'))

        program.command('delete <name>')
            .description('delete a project')
            .action(this.getMethod('deleteProject'))

        program.command('run <name>')
            .description('run a project')
            .option('-e, --export', 'export data only')
            .option('-t, --test', 'custom test only')
            .option('-d, --daemon', 'run with daemon mode')
            .option('-c, --custom','run custom code after the project finished')
            .action(this.getMethod('runProject'))

        program.command('stop <name>')
            .description('stop a project')
            .option('-r, --restart', 'stop and restart project')
            .action(this.getMethod('stopProject'))

        // program.command('reset <name>')
        //     .description('reset a project')
        //     .option('--hard', 'delete all data of project')
        //     .action(this.getMethod('resetProject'))

        program.command('config [name]')
            .description('edit global or project config')
            .option('-s, --set <key=value>', 'set config')
            .option('-c, --custom', 'edit custom exec code')
            .option('-o, --overwrite', 'edit overwrite code of project')
            .option('-e, --export-data', 'edit custom export data code')
            .action(this.getMethod('setConfig'))

        program.command('serve')
            .description('launch a API server')
            .option('-H, --host', 'server address, default use 127.0.0.1')
            .option('-p, --port <port>', 'server port, default use 7000')
            .option('-d, --daemon', 'run with daemon')
            .action(this.getMethod('server'))

        program.command('load <data>')
            .description('load resource from tar, url, name')
            .addOption(new commander.Option('-t, --type <value>', 'select resource type').choices(['task', 'driver', 'storage']))
            .action(this.getMethod('load'))

        program.command('logs [project]')
            .description('stream logs file. Default stream all logs')
            .action(this.getMethod('logs'))

        program.command('export <project>')
            .description('export project data')
            .option('-f --save-path <path>','absolute path of saved data')
            .option('-d, --data', 'export with data dir')
            .action(this.getMethod('export'))

        return program.parseAsync()
    }

    static getInstance() {
        if(!this.instance){
            this.instance = new Cli
        }
        return this.instance
    }

    get core() {
        if (!this._core) {
            this._core = Core.getInstance()
        }
        return this._core
    }
    
    // xx = xx => (){} 形式的方法会忽略 装饰器方法
    @preCheck()
    async listInfo(options){
        if(options.all) {
            this.listTask()
            this.listDriver()
            this.listProject()
            return
        }
        if(!options.type) return this.listProject()
        switch (options.type) {
            case 'task':
                return this.listTask()
            case 'project':
                return this.listProject()
            case 'driver':
                return this.listDriver()
            default:
                throw new Error(this.getMsg(22))
        }
    }

    async listProject(){
        const projectsData = await this.core.listProject()
        console.log(this.getMsg(21))
        if(projectsData.length == 0){
            console.log('  ',this.getMsg(40))
            return
        }

        console.table(
            projectsData.map(project => {
                return {
                    Name: project.name,
                    Description: project.desc || '',
                    createTime: project.createTime || '-'
                }
            })
        )
    }

    async listTask(){
        const taskList = await this.core.listTask()
        console.log(this.getMsg(20))
        console.table(
            taskList.map(task => {
                return {
                    Name: task.name,
                    Ver: task.version,
                    Default: this.appSettings?.Task?.Default === task.name ? 'Y' : '-'
                }
            })
        )
    }

    async listDriver(){
        const driverList = await this.core.listDriver()
        console.log(this.getMsg(23))
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
        name = await this.core.getProjectName(name)
        return this.core.logs(name, options)
    }

    @preCheck()
    async createProject(name, {task}) {
        this.log.info(this.getMsg(15,name))
        await this.core.checkName(name)
        return this.core.createProject(name,task)
    }

    @preCheck()
    async deleteProject(name){
        name = await this.core.getProjectName(name)
        try {
            await this.core.deleteProject(name)
            this.log.info(this.getMsg(16))
        } catch (e) {
            this.log.err(e)
        }
    }

    @preCheck()
    async runProject(name, options) {
        name = await this.core.getProjectName(name)
        if (options.export) {
            return (await this.core.getProject(name, true)).exportData()
        } else if (options.test) {
            return (await this.core.getProject(name, true)).test()
        } else if (options.custom) {
            return (await this.core.getProject(name, true)).execCustomCode()
        } else if (options.daemon) {
            const sp = await this.core.startProjectByDaemon(name)
            this.log.info(this.getMsg(17,name,sp.pid))
            return
            // TODO: 重写后台运行功能
            // try {
            //     const pid = await Utils.readFile(path.join(this.core.config.DataPath, name, 'project.pid'))
            //     const pInfo = await pidusage(parseInt(pid))
            //     this.log.err(`Run Project Err: Project is running at ${pInfo.pid}`)
            // } catch (error) {
            //     this.log.info(`Project [${name}] ready to run with daemon`)
            //     return Utils.createProcess(path.resolve(__dirname, '../bin/index.js'), ['run', name])
            // }
        }
        return (await this.core.getProject(name, true)).start()
    }

    @preCheck()
    async stopProject(name, options) {
        name = await this.core.getProjectName(name)
        this.log.info(this.getMsg(19,name))
        await this.core.stopProject(name)
        if (options.restart) {
            this.log.info(this.getMsg(18,name))
            await this.core.restartProject(name)
        }
    }

    @preCheck()
    async resetProject(name, options) {
        name = await this.core.getProjectName(name)
        return this.core.resetProject(name, options)
    }

    async setConfig(name, options) {
        // open or edit project config if has project name
        if (name) {
            return this.setProjectConfig(name, options)
        }
        const editorBinName = await this.getEditor()
        return this.openEditor(editorBinName, this.constData.AppConfigUserPath)
    }

    @preCheck()
    async setProjectConfig(name, options) {
        let configPath = ''
        name = await this.core.getProjectName(name)
        const project = await this.core.getProject(name)
        if (!project) return
        configPath = project.getPath('config')
        if (options.set) {
            return this.core.setProjectConfig(name, options.set)
        }
        if (options.custom) {
            configPath = project.getPath('custom_exec_code')
        }
        if (options.overwrite) {
            configPath = project.getPath('custom_over_write_code')
        }
        if (options.exportData) {
            configPath = project.getPath('custom_export_data')
        }
        const editorBinName = await this.getEditor()
        return this.openEditor(editorBinName, configPath)
    }

    @preCheck()
    async server(options) {
        const server = Server.getInstance(options)
        server.launch()
        console.log(`The API server is running at : ${server.serverConfig.host}:${server.serverConfig.port}`)
    }

    @preCheck()
    async export(name, options){
        name = await this.core.getProjectName(name)
        const exportFile = await this.core.exportProject(name,options)
        this.log.info(`export data at : ${exportFile}`)
    }

    // get method bind this
    getMethod(method){
        return this[method].bind(this)
    }

    async openEditor(editorBinName, filePath){
        if(!editorBinName){
            throw new Error(this.getMsg(33, filePath))
        }
        return new Promise((resolve,reject) => {
            const dealErr = (error)=>{
                this.log.debug(`open editor error: ${error?.message || error}`)
                reject(new Error(this.getMsg(32, editorBinName)))
            }
            // win10 need update vscode location : https://github.com/lahmatiy/open-in-editor/pull/22
            openInEditor.configure({
                editor: editorBinName
            }, dealErr)?.open(filePath)
            .then(resolve)
            .catch(dealErr)
        })
    }
}