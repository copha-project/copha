const path = require('path')
const events = require('events')
const Utils = require('uni-utils')
const Base = require('./base')
const Storage = require('../storage')

class Task extends Base {
    #conf = null
    #storage = null
    #event = null
    #driver = null
    #custom = null
    #job = null
    constructor(conf) {
        super()
        this.#conf = conf
        this.#initValue()
        this.#initLogger()
    }
    static getPath(name,key){
        if(!name) throw new Error(`task name cannot be empty`)
        if(!this.AppTaskPathSet.hasOwnProperty(key)) throw new Error(`path about '${key}' not exist`)
        return path.join(this.appSettings.DataPath,name,this.AppTaskPathSet[key])
    }

    //public 方法
    getPath(key) {
        return Task.getPath(this.#name,key)
    }
    async test(){
        return this.#test()
    }
    async start(){
        return this.#start()
    }
    async setPage(page) {
        return this.#setPage(page)
    }
    async reset(options){
        await this.#jobs?.reset()
        // delete log
        await this.#deleteLog()
        // task.pid set ''
        await this.#clearPid()
        // delete data of cache
        if(options.hard){
            await this.#deleteData()
        }
    }
    async exportData() {
        this.log.info('Prepare to export data')
        // TODO: 使用用户自定义的导出函数
        if(this.#conf.process?.CustomStage?.ExportData){
            if(await Utils.checkFile(this.getPath('custom_export_data')) !== true) throw new Error(this.getMsg(5))
            this.log.info('Start exec custom method of export data')
            const customCode = require(this.getPath('custom_export_data'))
            return customCode?.call(this)
        }

        let files = await this.storage.all()
        // if (this.storage.type == "file") {
            // files = (await Utils.readDir(this.getPath('saveDetailDataDir')))
            //     .filter(f => f.endsWith('.json'))
            //     .map(f => path.join(this.getPath('saveDetailDataDir'), f))
        // } else {
            // TODO: 不要一次性导出所有数据

        // }

        if (files.length == 0) {
            throw new Error('0 files, not need save.')
        }
        this.log.info(`has ${files.length} data prepare to export`);
        const endData = await Utils.loopTask(files, Utils.readJson, {
            timeGap: 0
        })
        //特殊处理 [[item],[[item],[item]]] [{item},[{item},{item}]] 数据
        // const endData = []
        // data.map(item=>{
        //     endData.push(`"${item.data.join('","')}"`)
        //     // endData.push(item.data)
        // })
        this.log.info(`first export data preview: ${endData[0]}`)
        const filename = `${Utils.getTodayDate()}_${endData.length}_export_data`
        try {
            await Utils.exportFile(endData, path.join(this.getPath('data_dir'), `export/${filename}.json`), 'json')
            await Utils.exportFile(endData, path.join(this.getPath('data_dir'), `export/${filename}.csv`), 'csv')
        } catch (error) {
            this.log.err(`export data failed:`, error.message)
        }
        this.log.info('data export success.')
        await this.storage.close()
    }
    async execCode() {
        return this.#execCode()
    }
    //public end

    async init(){
        // 初始化 web-driver
        this.#loadWebDriver()
        // 判断任务类型，加载任务模块
        this.#loadJob()
        // 初始化 用户自定义操作
        this.#loadCustomCode()
        // 初始化相关任务事件
        this.#loadEvent()
    }

    async #startPrepare(){
        this.init()
        this.#setExitHandle()
        await this.#setRunPid()

        await this.#driver?.init()
        await this.#job?.init()

        this.#job.setDriver(this.#driver)
        this.#job.setCustom(this.#custom)
        this.#job.setStorage(this.#storage)
    }

    async #test() {
        this.log.info(this.getMsg(6))
        try {
            await this.#startPrepare()
            await this.#runBefore()
            await this.#job.runTest()
            await Utils.sleep(this.#conf.process.Test.WaitExitTime * 1000)
        } catch (error) {
            this.log.err(`Run test err: ${error}`)
        } 
    }

    //interface of job

    async #runBefore() {
        if (this.#conf.process?.CustomStage?.RunBefore) {
            await this.#custom?.runBefore.call(this)
        } else {
            await this.#job?.runBefore()
        }
        this.log.info('Runbefore in task finished')
    }

    async #start() {
        this.log.info(this.getMsg(7,this.#name))
        try {
            await this.#startPrepare()
            await this.#runBefore()
            await this.#job?.run()
            await this.#execCode()
        } catch (error) {
            this.log.err(`Task start error: ${error}`)
            // 遇到错误退出程序，有可能的话重启进程
            await this.#saveContext()
            this.log.info(`check need to restart: ${this.#conf?.main?.alwaysRestart}`)
            if (this.#conf?.main?.alwaysRestart) {
                // must delay some time to restart
                this.#restart()
            }
        }
        await this.#clear()
        this.log.info('Task finished')
    }

    async #execCode(){
        if(await Utils.checkFile(this.getPath('custom_exec_code')) !== true) throw new Error(this.getMsg(5))
        this.log.info('start exec custom code')
        const customCode = require(this.getPath('custom_exec_code'))
        return customCode?.call(this)
    }

    async #clear() {
        await this.#job?.clear()
        await this.#driver?.clear()
        // delete pid file
        await this.#clearPid()
    }

    async #saveContext() {
        await this.#job?.saveContext()
    }

    // self method
    async #setRunPid(){
        return Utils.saveFile(`${process.pid}`,this.getPath('pid'))
    }

    async #deleteLog() {
        await Utils.rm(this.getPath('info_log'))
        await Utils.rm(this.getPath('err_log'))
    }

    async #clearPid() {
        return Utils.saveFile('', this.getPath('pid'))
    }

    async #deleteData() {
        await Utils.rm(`${this.getPath('data_dir')}/detail/*`)
    }

    #setExitHandle() {
        let exitProcess = false // 防抖，多次按退出
        const exitScript = async (args) => {
            this.log.warn(`get exit signal by ${args}`)
            if (!exitProcess) {
                exitProcess = true
                // 等待正在进行的任务，通过检查vNeedStop变量来判断是否需要暂停任务
                this.log.warn('检测到关闭操作，通知业务暂停。')
                this.vNeedStop = true
            }
        }
        process.on('SIGINT', exitScript)
        // process.on('SIGTERM', exitScript)
        // process.on('SIGHUP',exitScript)
    }

    #initValue() {
        // 外界发出关闭指令，内部发出需要停止信号，通知相关流程暂停运行，等待程序关闭
        this.vNeedStop = false
    }
    
    #initLogger(){
        if (this.#conf){
            this.setLog({
                'infoPath': this.getPath('info_log'),
                'errPath': this.getPath('err_log')
            })
        }
    }

    #initStorage() {
        this.log.debug('Task: init storage')
        try {
            this.#storage = new Storage(this.#conf)
            this.#storage.init()
        } catch (e) {
            throw new Error(`init storage error: ${e}`)
        }
    }

    #loadWebDriver() {
        try {
            const driverClass = require(`../drivers/${this.#conf.main?.useDriver || 'selenium'}`)
            this.#driver = new driverClass(this.#conf)
            // BUG: 使用代理后，类内部的私有变量就无法使用
            // this.#driver = new Proxy(new driverClass(this.#conf), {
            //     get: (target,propKey) => {
            //         if(propKey in target){
            //             return target[propKey]
            //         }else{
            //             return target.driver[propKey]
            //         }
            //     }
            // })
        } catch (error) {
            throw new Error(`can't load custom driver module : ${error.message}`)
        }
    }
    
    #loadJob(){
        const jobName = this.constData.AppTaskTypeMap[this.#conf.main?.type] || 'empty'
        try {
            const jobClass = require(`../jobs/${jobName}`)
            this.#job = new jobClass(this.#conf)
        } catch (error) {
            throw new Error(`can't load job [${jobName}] : ${error}`)
        }
    }
    
    #loadCustomCode() {
        try {
            this.#custom =  require(this.getPath('custom_over_write_code'))
        } catch (e) {
            throw new Error(`loadCustomCode error : ${e}`)
        }
    }

    #loadEvent(){
        this.#event = new events.EventEmitter()
        this.#event.on('taskCanStop',async ()=>{
            this.log.warn('Ready to stop process, plaese waitting')
            await this.#saveContext()
            process.exit(0)
        })
    }

    async #restart(){
        const count = 0
        const waitSecond = 2 ** (parseInt(count) || 1)
        this.log.warn(`-----wait ${waitSecond}s Restart Process -----`)
        await Utils.sleep(waitSecond * 1000)
        // Utils.restartProcess()
    }

    get storage(){
        if(!this.#storage){
            this.#initStorage()
        }
        return this.#storage
    }

    get Driver(){
        return this.#driver?.DriverModule
    }

    get #name(){
        return this.#conf?.main?.name
    }

    get helper(){
    	return {
            getDedailList : async () => {
        		const files = await Utils.readDir(path.join(this.getPath('data_dir'),'detail'))
        		return files.filter(e => e.endsWith('.json'))
        	},
        	getExportJsonData : async () => {
        		return Utils.readJson(path.join(this.getPath('data_dir'), 'export/export.json'))
        	},
        	download : Utils.listDownload
        }
    }
}

module.exports = Task
