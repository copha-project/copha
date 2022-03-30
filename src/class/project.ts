import path from 'path'
import events from 'events'
import Utils from 'uni-utils'
import Base from './base'
import Common from '../common'
import Task from './task'
import Core from './core'

export const getProject = async (projectConfig, core) => {
    const project = Project.getInstance<Project>()
    project.setConf(projectConfig)
    if(core) project.setCore(core)
    await project.init()
    return project
}
export default class Project extends Base {
    private _core: Core
    private _conf: ProjectConfig
    private _storage: BaseObject
    private _event: BaseObject
    private _task: Task
    private _driver: BaseObject
    private _notification: BaseObject
    private _custom: BaseObject

    constructor() {
        super()
        this.initValue()
        this.initLogger()
    }

    static getPath(name: string, key: string){
        if(!name) throw new Error(this.getMsg(12))
        if(this.constData.AppProjectPathSet[key] === undefined) throw new Error(this.getMsg(13, key))
        return path.join(this.appSettings.DataPath,name,this.constData.AppProjectPathSet[key])
    }

    setCore(v: Core){
        this._core = v
    }

    getPath(key) {
        return Project.getPath(this.name,key)
    }

    async reset(options){
        await this.task?.reset()
        // delete log
        await this.deleteLog()
        // task.pid set ''
        await this.clearPid()
        // delete data of cache
        if(options.hard){
            await this.deleteData()
        }
    }

    async exportData() {
        this.log.info('Prepare to export data, todo')
        return
        // if(!await Utils.checkFile(this.getPath('custom_export_data'))) throw new Error(this.getMsg(5))
        // this.log.info('Start exec custom method of export data')
        // const customCode = await import(this.getPath('custom_export_data')).then(e=>e.default)
        // return customCode?.call(this.customCodeThis)

        // const files = await this.storage.all()

        // if (files.length == 0) {
        //     throw new Error('0 files, not need save.')
        // }
        // this.log.info(`has ${files.length} data prepare to export`);
        // const endData = await Utils.loopTask(files, Utils.readJson, {
        //     timeGap: 0
        // })
        //特殊处理 [[item],[[item],[item]]] [{item},[{item},{item}]] 数据
        // const endData = []
        // data.map(item=>{
        //     endData.push(`"${item.data.join('","')}"`)
        //     // endData.push(item.data)
        // })
        // this.log.info(`first export data preview: ${endData[0]}`)
        // const filename = `${Utils.getTodayDate()}_${endData.length}_export_data`
        // try {
        //     await Utils.exportFile(endData, path.join(this.getPath('data_dir'), `export/${filename}.json`), 'json')
        //     await Utils.exportFile(endData, path.join(this.getPath('data_dir'), `export/${filename}.csv`), 'csv')
        // } catch (error) {
        //     this.log.err(`export data failed:`, error.message)
        // }
        this.log.info('data export success.')
    }

    //public end

    async init(){
        await this.loadTask()
        await this.loadCustomCode()
    }

    private async startPrepare(){
        this.setExitHandle()
        await this.setRunPid()
 
        await this.task?.init()

        // 初始化相关任务事件
        this.loadEvent()
    }

    async test() {
        this.log.info(this.getMsg(6))
        Common.domain(
            async ()=>{
                await this.startPrepare()
                await this.task?.runBefore()
                await this.task?.runTest()
            }, async (error)=>{
                this.log.err(`test err: ${error.message}`)
            }, async ()=>{
                await this.clear()
                this.log.info('Task test finished')
            })
    }

    async start() {
        this.log.info(this.getMsg(7,this.name))
        Common.domain(
            async ()=>{
                await this.startPrepare()
                await this.task?.runBefore()
                await this.task?.run()
                await this._execCustomCode()
            }, async (error)=>{
                this.log.err(`Task run error: ${error.message}`)
                console.log(error)
                // 遇到错误退出程序，有可能的话重启进程
                await this.saveContext()
                this.log.info(`check need to restart: ${this.conf?.AlwaysRestart}`)
                if (this.conf?.AlwaysRestart) {
                    // must delay some time to restart
                    this.restart()
                }
            }, async ()=>{
                await this.clear()
                this.log.info('Task finished')
                this.notification.send('Task finished')
            })
    }

    async execCustomCode(){
        Common.domain(
            async ()=>{
                await this._execCustomCode()
            }, async (error: Error)=>{
                this.log.err(`execCustomCode err: ${error.message}`)
            }, async ()=>{
                this.log.info(`custom code exec end.`)
                this.clear()
            })
    }

    private async clear() {
        await this.task?.clear?.()
        await this.driver?.clear?.()
        // delete pid file
        await this.clearPid()
    }

    private async saveContext() {
        return this.task?.saveContext?.()
    }

    // self method
    private async _execCustomCode(){
        if(!await Utils.checkFile(this.getPath('custom_exec_code'))) throw new Error(this.getMsg(5))
        this.log.info('start exec custom code')
        const modulePath = this.getPath('custom_exec_code')
        const customCode = await import(modulePath).then(e=>e.default)
        return customCode?.call(this.customCodeThis)
    }

    private async setRunPid(){
        this.log.info(`Task run pid on : ${process.pid}`)
        return Utils.saveFile(`${process.pid}`,this.getPath('pid'))
    }

    private async deleteLog() {
        await Utils.rm(this.getPath('info_log'))
        await Utils.rm(this.getPath('err_log'))
    }

    private async clearPid() {
        return Utils.saveFile('', this.getPath('pid'))
    }

    private async deleteData() {
        await Utils.rm(`${this.getPath('data_dir')}/detail/*`)
    }

    private setExitHandle() {
        this.log.debug('set setExitHandle()')
        let exitCount = 0 // 防抖，多次按退出
        const exitScript = async (...args) => {
            this.log.warn(`get exit signal by ${args}`)
            if (!exitCount) {
                exitCount = 1
                // 等待正在进行的任务，通过检查vNeedStop变量来判断是否需要暂停任务
                this.log.warn('检测到关闭操作，通知业务暂停。')
                // this.vNeedStop = true
            }else{
                this.log.warn('强制关闭!')
                await this.clear()
                process.exit()
            }
        }
        process.on('SIGINT', exitScript)
        // process.on('SIGTERM', exitScript)
        // process.on('SIGHUP',exitScript)
    }

    private initValue() {
        // TODO: 外界发出关闭指令，内部发出需要停止信号，通知相关流程暂停运行，等待程序关闭
        // this.vNeedStop = false
    }

    private initLogger(){
        if (this.conf){
            this.setLog({
                'infoPath': this.getPath('info_log'),
                'errPath': this.getPath('err_log')
            })
        }
    }

    // private async loadModule(module:Module){       
    //     const moduleClass = await this.core.getModule(module.name)
        
    //     this[`_${module.type}`] = await moduleClass.getInstance()
    //     this[`_${module.type}`].setTaskConfig(this.conf)
    // }

    private async loadTask(){
        let task:Module
        if(!this.conf.Task){
            task = await this.core.defaultTask()
        }
        task = await this.core.getModuleInfo(this.conf.Task)

        const moduleClass = await this.core.getModule(task.name)
        
        this._task = await moduleClass.getInstance()


    }

    private async loadCustomCode() {
        try {
            this._custom =  require(this.getPath('custom_over_write_code'))
        } catch (e) {
            throw new Error(`loadCustomCode error : ${e}`)
        }
    }

    private loadEvent(){
        this._event = new events.EventEmitter()
        this._event.on('taskCanStop',async ()=>{
            this.log.warn('Ready to stop process, plaese waitting')
            await this.saveContext()
            process.exit(0)
        })
    }

    private async restart(){
        const count = 0
        const waitSecond = 2 ** (count || 1)
        this.log.warn(`-----wait ${waitSecond}s Restart Process -----`)
        await Utils.sleep(waitSecond * 1000)
        // Utils.restartProcess()
    }

    setConf(v: ProjectConfig){
        this._conf = v
    }

    get task(){
        return this._task
    }

    get conf(){
        return this._conf
    }

    get storage(){
        return this._storage
    }

    get driver(){
        return this._driver
    }

    get custom(){
        return this._custom
    }

    get driver_(){
        return this.driver?.driver
    }

    get Driver(){
        return this.driver?.DriverModule
    }

    get notification(){
        return this._notification
    }

    get name(){
        return this.conf.Name
    }

    get customCodeThis(){
        return {
            uni: Utils,
            log: this.log,
            getPath: this.getPath.bind(this),
            getDedailList : async () => {
                const files = await Utils.readDir(path.join(this.getPath('data_dir'),'detail'))
                return files
                .filter(e => e.endsWith('.json'))
                .map(e=>path.join(this.getPath('data_dir'),'detail',e))
            },
            getExportJsonData : async () => {
                return Utils.readJson(path.join(this.getPath('data_dir'), 'export/export.json'))
            },
            download : Utils.download,
            getTaskResource: this.task.getResource.bind(this.task),
            driver: this.driver
        }
    }

    get core(){
        return this._core
    }
}