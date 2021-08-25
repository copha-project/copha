const path = require('path')
const fs = require('fs')
const events = require('events')
const Utils = require('uni-utils')
const Base = require('./base')
const Storage = require('../storage')

class Task extends Base {
    #storage = null
    #event = null
    constructor(conf) {
        super(conf)
        this.#initValue()
        // 初始化 web-driver
        this.driver = this.#initWebDriver()
        // 初始化 用户自定义操作
        this.custom = this.#setCustomCode()

        this.driver.setCustom(this.custom)
        this.#event = new events.EventEmitter()
    }
    static getPath(name,key){
        if(!name) throw new Error(`task name cannot be empty`)
        if(key !== 'root' && !this.AppTaskPathSet[key]) throw new Error(`path about '${key}' not exist`)
        return path.join(this.appSettings.DataPath,name,this.AppTaskPathSet[key]||'')
    }

    async #startPrepare(){
        this.#setExitHandle()
        this.#event.on('taskCanStop',async ()=>{
            this.log.warn('Ready to stop process, plaese waitting')
            await this.#saveContext()
            process.exit(0)
        })
        this.#setRunPid()
    }
    async test() {
        this.log.info(this.getMsg(6))
        this.driver.setTestState(true)
        this.vTestState = true
        try {
            await this.initDriver()
            await this.openUrl()
            await this.runBefore()
            await this.runTest()
            await Utils.sleep(this.conf.process.Test.WaitExitTime * 1000)
        } catch (error) {
            this.log.err(`Run test err: ${error.message}`)
        } finally {
            await this.#clear()
        }
    }

    /**
        1 初始化 driver
        2 运行 task
        3 收尾
    */
    async start() {
        this.log.info(this.getMsg(7,this.#name))
        let hasErr = false
        try {
            await this.#startPrepare()
            await this.initDriver()
            this.log.info('init Driver finished')
            await this.#loadState()
            await this.openUrl()
            await this.runBefore()
            await this.#initPageInfo()
            this.vStartState = true
            do {
                await this.#listFetch()
                await this.#checkNeedStop()
                await Utils.sleep(5000)
            } while (!this.finished)
        } catch (error) {
            this.log.err(`work start error: ${error}`)
            hasErr = true
        }
        await this.#checkNeedStop()
        // 遇到错误退出程序，有可能的话重启进程
        if (hasErr) {
            try {
                await this.#clear()
                await this.#saveContext()
                this.log.info(`check need to restart: ${this.conf?.main?.alwaysRestart}`)
                if (this.conf?.main?.alwaysRestart) {
                    await this.#restart()
                }
            } catch (error) {
                //pass
            }
            return
        }
        await this.#execCode()
        await this.#recover()
        await this.#clear()
        this.log.info('Task finished')
    }
    #setExitHandle() {
        let exitProcess = false // 防抖，多次按退出
        const exitScript = async (args) => {
            // 只有start需要执行特别退出流程
            if (!this.vStartState) process.exit(0)
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
    async #loadState() {
        // 导入任务状态
        this.state = await this.getState()
        this.log.info('getState finished')
        // 导入可能存在的未完成的页数据
        await this.importReworkPages()
        this.log.info('importReworkPages finished')
        // 导入上次任务最后的数据
        this.currentPage = this.lastRunPage = await this.#getLastPage()
    }

    async #listFetch() {
        this.log.info('start fetch data')
        while (this.currentPage <= this.pages) {
            // 检查是否有停止信号
            await this.#checkNeedStop()
            try {
                const notDoneList = await this.#doList()
                if (notDoneList.length > 0) {
                    throw new Error('do list not complete')
                }
            } catch (error) {
                this.log.err(`listFetch -> getList rework : ${this.currentPage}, ${error.message}`);
                this.reworkPages.push(this.currentPage)
            }
            await this.#checkNeedStop()
            try {
                await this.#goNext()
            } catch (error) {
                this.log.err(`listFetch -> goNext : ${error.message}`)
                await this.openUrl()
                await this.goPage(this.currentPage--)
            }
            await Utils.sleep(this.appSettings.ListTimeInterval)
        }
        // await this.#subFetch()
        this.finished = true
    }
    // TODO: rework 功能暂时屏蔽
    async #subFetch() {
    //     // 处理需要重新进行的列表页
    //     if (this.reworkPages.length > 0) {
    //         this.log.info(`start rework page : [${this.reworkPages}]`)
    //         for (let i = 0; i < this.reworkPages.length;) {
    //             const page = this.reworkPages[i]
    //             this.log.info(`rework page: ${page}`)
    //             let hasErr = false
    //             try {
    //                 await this.goPage(page)
    //                 this.log.info(`refetch data of : ${page} page`)
    //                 const notDoneList = await this.getList()
    //                 if (notDoneList.length > 0) {
    //                     hasErr = true
    //                 }
    //             } catch (error) {
    //                 hasErr = true
    //             }
    //             if (!hasErr) i++
    //             await Utils.sleep(1000)
    //         }
    //
    //         this.reworkPages = []
    //     }
    }

    async #doList() {
        let list = await this.getListData()
        this.log.info(`fetch list data : length ${list.length} , ${this.currentPage}/${this.pages} pages`);
        const notDoneList = []
        for (const i in list) {
            // 检查是否有停止信号
            await this.#checkNeedStop()
            // 解决获取item时跳转页面导致的item值失效
            const realList = await this.getListData()
            const item = realList[i]
            let id
            try {
                item._idx = i
                id = await this.getItemId(item)
            } catch (error) {
                this.log.err(`get list item id error :` + error.message)
                notDoneList.push(id)
                continue
            }
            //是否已经保存过该页面数据
            const hasExist = await this.#find(id)
            if (hasExist) {
                this.log.warn(`item data has saved : ${id}`)
                continue
            }
            try {
                const itemData = await this.getItemData(item)
                const contentTest = JSON.stringify(itemData)
                if (contentTest == '[]' || contentTest == '{}') {
                    throw new Error(`item : ${id} content is empty`)
                }
                await this.#save(itemData, id)
            } catch (e) {
                this.log.err(`item data get error : ${e.message}`)
                notDoneList.push(id)
                continue
            }
            await Utils.sleep(this.conf.main.pageTimeInterval * 1000 || 500)
        }
        if (notDoneList.length === list.length) {
            this.vItemsErrIndex += 1
            const sleepTime = 10 ** this.vItemsErrIndex
            this.log.warn(`fetch item error, sleep ${sleepTime}s to continue!!`)
            await Utils.sleep(sleepTime * 1000)
        } else {
            this.vItemsErrIndex = 0
        }
        return notDoneList
    }
    async #save(data, id) {
        this.log.info(`save item data of ${id}`)
        return this.storage.save({id,data})
    }
    async #find(id) {
        return this.storage.findById(id)
        // if (this.storage.type == "file") {
        //     const file = path.join(this.getPath('saveDetailDataDir'), `${id}.json`)
        //     return await Utils.checkFile(file) === true
        // } else {
        //     const res = await this.storage.query('detail', {
        //         name: id
        //     })
        //     return res.length === 1
        // }
    }

    async importReworkPages() {
        const pagesString = await Utils.readFile(this.getPath('rework_pages'))
        try {
            const pages = JSON.parse(pagesString)
            if (pages?.length > 0) {
                this.reworkPages.push(...pages)
            }
        } catch (error) {
            throw new Error(`import rework pages error: ${pagesString}`)
        }
    }

    // 可代理的方法
    async #execCode(){
        if(await Utils.checkFile(this.getPath('custom_exec_code')) !== true) throw new Error(this.getMsg(5))
        this.log.info('start exec custom code')
        const customCode = require(this.getPath('custom_exec_code'))
        return customCode?.call(this)
    }

    //public 方法
    /**
     * 返回 task 相关配置的路径
     */
    getPath(key) {
        // TODO: 需要整理一下路径的代码
        // const name = this[key] || this.#paths[key]
        // return name
        return Task.getPath(this.#name,key)
    }
    async setPage(page) {
        return this.#setPage(page)
    }
    async reset(options){
        // last_page.txt set 1
        await this.#setPage(1)
        // reworks pages set []
        await this.#resetReworkPages()
        // delete log
        await this.#deleteLog()
        // task.pid set ''
        await this.#clearPid()
        // task_state.json set init
        await this.#clearState()
        // delete data of cache
        if(options.hard){
            await this.#deleteData()
        }
    }
    async exportData() {
        this.log.info('Prepare to export data')
        // TODO: 使用用户自定义的导出函数
        if(this.conf.process?.CustomStage?.ExportData){
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
            await Utils.exportFile(endData, path.join(this.getPath('data'), `export/${filename}.json`), 'json')
            await Utils.exportFile(endData, path.join(this.getPath('data'), `export/${filename}.csv`), 'csv')
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

    // interface of task
    async #initPageInfo() {
        await Utils.sleep(1000)
        this.pages = await this.getPages()
        if (this.pages == 0) this.pages = this.appSettings.DefaultMaxPages
        this.currentPage = await this.getCurrentPage()
        this.log.info(`last page: ${this.lastRunPage},current page: ${this.currentPage},pages: ${this.pages}`)
        if (this.lastRunPage > this.currentPage && this.lastRunPage <= this.pages) {
            this.currentPage = this.lastRunPage
            await this.goPage(this.currentPage)
        }
    }
    async #getLastPage() {
        const page = await Utils.readFile(this.getPath('last_page'))
        return parseInt(page) || 1
    }
    async #goNext() {
        this.currentPage++
        if (this.pages < this.currentPage) return
        return this.goPage(this.currentPage)
    }
    /**
     * 获取任务进度状态信息
     */
    async getState() {
        if (this.driver.getState) return this.driver.getState()
        let state = {}
        try {
            state = await Utils.readJson(this.getPath('state'))
        } catch (error) {
            // pass
        }
        return state
    }
    async saveState() {
        if (this.driver.saveState) return this.driver.saveState(this.state)
        if (this.state) await Utils.saveJson(this.state, this.getPath('state'))
    }
    /**
     * 清除各种进程
     */
    async #clear() {
        return this.driver.clear()
    }
    /**
     * 打开 URL 窗口
     */
    async openUrl() {
        return this.driver.openUrl()
    }
    /**
     * 初始化diver
     */
    async initDriver() {
        return this.driver.initDriver()
    }

    //interface of process
    async runBefore() {
        if (this.conf.process?.CustomStage?.RunBefore) {
            await this.custom?.runBefore.call(this)
        } else {
            await this.driver?.runBefore()
        }
        this.log.info('Runbefore finished')
    }
    async goPage(p) {
        return this.driver.goPage(p)
    }
    async getPages() {
        return this.driver.getPages()
    }
    async getCurrentPage() {
        return this.driver.getCurrentPage()
    }
    async getListData() {
        return this.driver.getListData()
    }
    async getItemData(item) {
        if (this.custom.getItem) {
            await this.custom.getItem(item)
        }
        return this.driver.getItemData(item)
    }
    async getItemId(item) {
        if (this.conf.process?.CustomStage?.GetItemId) {
            return this.custom.GetItemId(item)
        } else {
            return this.driver?.getItemId(item)
        }
    }
    async runTest() {
        return this.driver.runTest()
    }
    // self method
    #setRunPid(){
        fs.writeFileSync(this.getPath('pid'), `${process.pid}`)
    }
    // set page of task run start
    async #setPage(page) {
        return Utils.saveFile(`${page}`, this.getPath('last_page'))
    }
    async #resetReworkPages(){
        return Utils.saveFile('[]', this.getPath('rework_pages'))
    }
    async #deleteLog() {
        await Utils.rm(this.getPath('info_log'))
        await Utils.rm(this.getPath('err_log'))
    }
    async #clearPid() {
        return Utils.saveFile('', this.getPath('pid'))
    }
    async #clearState(){
        const state = await Utils.readJson(this.getPath('state'))
        state.RestartCount = 0
        return Utils.saveJson(state,this.getPath('state'))
    }
    async #deleteData() {
        await Utils.rm(`${this.getPath('data')}/detail/*`)
    }

    #initValue() {
        this.currentPage = 1
        this.pages = 1
        this.state = null

        this.reworkPages = []
        this.finished = false
        // 临时状态设置
        this.vItemsErrIndex = 0

        // 外界发出关闭指令，内部发出需要停止信号，通知相关流程暂停运行，等待程序关闭
        this.vNeedStop = false
        // 测试流程运行标志
        this.vTestState = false
        // 正式运行流程运行标志
        this.vStartState = false

        this.driver = null
        this.custom = null
    }

    #initWebDriver() {
        try {
            const driverClass = require(`../drivers/${this.conf.main?.useDriver || 'selenium'}`)
            // return new driverClass({conf: this.conf})
            return new Proxy(new driverClass({ conf: this.conf }), {
                get: (target,propKey) => {
                    if(propKey in target){
                        return target[propKey]
                    }else{
                        return target.driver[propKey]
                    }
                }
            })
        } catch (error) {
            throw new Error(`can't load custom driver module : ${error.message}`)
        }
    }
    #setCustomCode() {
        try {
            return require(this.getPath('custom_over_write_code'))
        } catch (e) {
            throw new Error(`setCustomCode error : ${e}`)
        }
    }
    #getRestartCount() {
        if (!this.state?.RestartCount) {
            this.state.RestartCount = 1
        } else {
            this.state.RestartCount += 1
        }
        return this.state.RestartCount
    }
    #initStorage() {
        this.log.debug('Task: init storage')
        try {
            const storage = new Storage(this.conf)
            storage.init()
            return storage
        } catch (e) {
            throw new Error(`init storage error: ${e}`)
        }
    }
    // 恢复任务状态
    async #recover() {
        fs.writeFileSync(this.getPath('last_page'), `1`)
        fs.writeFileSync(this.getPath('rework_pages'), `[]`)
    }
    async #saveContext() {
        this.log.info(`Task will exit, save Context : current Page: ${this.currentPage}`)
        fs.writeFileSync(this.getPath('last_page'), `${this.currentPage}`)
        if (this.reworkPages.length > 0) {
            fs.writeFileSync(this.getPath('rework_pages'), JSON.stringify(this.reworkPages))
        }
        // save context state
        if (!this.vTestState) await this.saveState()

        // delete pid file
        fs.writeFileSync(this.getPath('pid'), ``)
    }
    async #restart(){
        const count = this.getRestartCount()
        const waitSecond = 2 ** (parseInt(count) || 1)
        this.log.warn(`-----wait ${waitSecond}s Restart Process -----`)
        await Utils.sleep(waitSecond * 1000)
        Utils.restartProcess()
    }
    async #checkNeedStop() {
        if (this.vNeedStop) {
            this.log.warn('检测到停止信号，业务暂停30s，等待程序停止')
            this.#event.emit('taskCanStop')
            await Utils.sleep(30000)
            this.log.warn('任务等待停止超时，强制停止进程')
            process.exit(1)
        }
    }
    get storage(){
        if(!this.#storage){
            this.#storage = this.#initStorage()
        }
        return this.#storage
    }
    get Driver(){
        return this.driver.Driver
    }
    get #name(){
        return this.conf?.main?.name
    }
    get helper(){
    	return {
            getDedailList : async () => {
        		const files = await Utils.readDir(path.join(this.getPath('data'),'detail'))
        		return files.filter(e => e.endsWith('.json'))
        	},
        	getExportJsonData : async () => {
        		return Utils.readJson(path.join(this.getPath('data'), 'export/export.json'))
        	},
        	download : Utils.listDownload
        }
    }
}

module.exports = Task
