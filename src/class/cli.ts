import openInEditor from 'open-in-editor'
import commander from 'commander'
import Base from './base'
import Core from './core'
import Server from './server'
import Common from '../common'

function preCheck() {
    return (target: Cli, k: string, descriptor: TypedPropertyDescriptor<(...args) => Promise<void>>) => {
        const method = descriptor.value
        descriptor.value = async function(...args){
            await Core.preCheck()
            return method?.apply(target, args)
        }
    }
}

export default class Cli extends Base {
    static instance: Cli
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
            .action(this.instance.listInfo)

        program.command('create <name>')
            .description('create a new project')
            .option('-t, --task <value>', 'choose a task, default with a empty task')
            .action(this.instance.createProject)

        program.command('delete <name>')
            .description('delete a project')
            .action(this.instance.deleteProject)

        program.command('run <name>')
            .description('run a project')
            .option('-e, --export', 'export data only')
            .option('-t, --test', 'custom test only')
            .option('-d, --daemon', 'run with daemon mode')
            .option('-c, --custom','run custom code after the project finished')
            .action(this.instance.runProject)

        program.command('stop <name>')
            .description('stop a project')
            .option('-r, --restart', 'stop and restart project')
            .action(this.instance.stopProject)

        // program.command('reset <name>')
        //     .description('reset a project')
        //     .option('--hard', 'delete all data of project')
        //     .action(this.instance.resetProject)

        program.command('config [name]')
            .description('edit global or project config')
            .option('-s, --set <key=value>', 'set config')
            .option('-c, --custom', 'edit custom exec code')
            .option('-o, --overwrite', 'edit overwrite code of project')
            .option('-e, --export-data', 'edit custom export data code')
            .action(this.instance.setConfig.bind(this))

        program.command('serve')
            .description('launch a API server')
            .option('-H, --host <host>', 'server address, default use 127.0.0.1')
            .option('-p, --port <port>', 'server port, default use 7000')
            .option('-d, --daemon', 'run with daemon')
            .action(this.instance.serve)

        program.command('load [data]')
            .description('load resource : project, module')
            .action(this.instance.load)

        program.command('logs [project]')
            .description('stream logs file. Default stream all logs')
            .action(this.instance.logs)

        program.command('export <project>')
            .description('export project data')
            .option('-f --save-path <path>','absolute path of saved data')
            .option('-d, --data', 'export with data dir')
            .action(this.instance.export)

        return program.parseAsync()
    }

    static getInstance() {
        if(!this.instance){
            this.instance = new Cli
        }
        return this.instance
    }

    static async run(){
        Common.loadPackageEnv()
        try {
            await Cli.installCheck()
            await Cli.getInstance().createCommander()
        } catch (e) {
            if(Common.isDebug){
                console.log(e)
            }else{
                Cli.log.err(e.message)
            }
            process.exit(1)
        }
    }

    private get core() {
        if (!this._core) {
            this._core = Core.getInstance()
        }
        return this._core
    }
    
    private get instance(){
        return Cli.getInstance()
    }

    // xx = xx => (){} 形式的方法会忽略 装饰器方法
    @preCheck()
    private async listInfo(options){
        if(options.all) {
            await this.listTask()
            await this.listDriver()
            await this.listStorage()
            await this.listNotification()
            await this.listProject()
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
            case 'storage':
                return this.listStorage()
            case 'notification':
                return this.listNotification()
            default:
                throw new Error(this.getMsg(22))
        }
    }

    private async listProject(){
        const projectsData = await this.core.listProject()
        console.log(this.getMsg(21))
        if(projectsData.length == 0){
            console.log('  ',this.getMsg(40))
            return
        }

        console.table(
            projectsData.map(project => {
                return {
                    Name: project.main.name,
                    Description: project.main.desc || '',
                    createTime: project.main.createTime || '-'
                }
            })
        )
    }

    private async listTask(){
        return this.listModule('Task')
    }

    private async listDriver(){
        return this.listModule('Driver')
    }

    private async listStorage(){
        return this.listModule('Storage')
    }

    private async listNotification(){
        return this.listModule('Notification')
    }

    private async listModule(name){
        const driverList: Module[] = await this.core['list'+name]()
        const isDefaultModuleName = this.appSettings.Modules?.[name]?.Default
        console.log(this.getMsg(23, name))
        console.table(
            driverList.map(driver => {
                return {
                    Name: driver.name,
                    Ver: driver.version,
                    Default: isDefaultModuleName  === driver.name ? 'Y' : '-',
                    Active: driver.active
                }
            })
        )
    }

    @preCheck()
    private async load(name){
        return this.core.load(name)
    }

    @preCheck()
    private async logs(name, options){
        name = await this.core.getProjectName(name)
        return this.core.logs(name, options)
    }

    @preCheck()
    private async createProject(name, {task}) {
        this.log.info(this.getMsg(15,name))
        await this.core.checkName(name)
        return this.core.createProject(name,task)
    }

    @preCheck()
    private async deleteProject(name){
        name = await this.core.getProjectName(name)
        try {
            await this.core.deleteProject(name)
            this.log.info(this.getMsg(16))
        } catch (e) {
            this.log.err(e)
        }
    }

    @preCheck()
    private async runProject(name, options) {
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
    private async stopProject(name, options) {
        name = await this.core.getProjectName(name)
        this.log.info(this.getMsg(19,name))
        await this.core.stopProject(name)
        if (options.restart) {
            this.log.info(this.getMsg(18,name))
            await this.core.restartProject(name)
        }
    }

    // @preCheck()
    // private async resetProject(name, options) {
    //     name = await this.core.getProjectName(name)
    //     return this.core.resetProject(name, options)
    // }

    private async setConfig(name, options) {
        // open or edit project config if has project name
        if (name) {
            return this.setProjectConfig(name, options)
        }
        const editorBinName = await this.getEditor()
        return this.openEditor(editorBinName, this.constData.AppConfigPath)
    }

    @preCheck()
    private async setProjectConfig(name, options) {
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
    private async serve(options: ServerConfig) {
        const server = Server.getInstance(options)
        server.launch()
        console.log(`The API server is running at : ${server.serverConfig.host}:${server.serverConfig.port}`)
    }

    @preCheck()
    private async export(name, options){
        name = await this.core.getProjectName(name)
        const exportFile = await this.core.exportProject(name,options)
        this.log.info(`export data at : ${exportFile}`)
    }

    private async openEditor(editorBinName, filePath): Promise<void>{
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