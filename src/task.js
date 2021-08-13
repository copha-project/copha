const path = require('path')
const fs = require('fs')
const Utils = require('uni-utils')
const Base = require('./class/base')
const Config = require('../config')

class Task extends Base {
    #paths = {}
    constructor(conf) {
        super(conf)
        this.#initValue()
        this.driver = this.#initWebDriver()
        // 初始化重写函数
        this.custom = this.#setCustomCode()
        this.driver.setCustom(this.custom)
        this.setExitHandle()
    }
    setExitHandle() {
        let exitProcess = false // 防抖，多次按退出
        const exitScript = async (args) => {
            // 只有start需要执行特别退出流程
            if (!this.vStartState) process.exit(0)
            this.log.warn(`get exit signal by ${args}`)
            if (!exitProcess) {
                exitProcess = true
                // 等待正在进行的任务，通过检查相关变量来判断是否可以停止任务
                this.log.warn('检测到关闭操作，等待业务暂停。')
                this.vNeedStop = true
                let limitTime = 0
                while (!this.vCanStop) {
                    limitTime++
                    await Utils.sleep(500)
                    if (limitTime > 40) {
                        this.log.warn(`Can't get signal of stop, but then stop process`)
                        break
                    }
                }
                this.log.warn('Ready to stop process, plaese waitting')
                await this.saveContext()
                process.exit(0)
            }
        }
        process.on('SIGINT', exitScript)
        // process.on('SIGTERM', exitScript)
        // process.on('SIGHUP',exitScript)
    }
    async init() {
        // 导入任务状态
        this.state = await this.getState()
        this.log.info('getState finished')
        // 导入可能存在的未完成的页数据
        await this.importReworkPages()
        this.log.info('importReworkPages finished')
        // 导入上次任务最后的数据
        this.currentPage = this.lastRunPage = await this.getLastPage()
    }
    async test() {
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
            await this.clear()
        }
    }
    async start() {
        this.#setRunPid()
        let hasErr = false
        try {
            await this.init()
            await this.initDriver()
            this.log.info('init Driver finished')
            await this.openUrl()
            this.log.info('openUrl finished');
            await this.runBefore()
            await this.initPageInfo()
            this.vStartState = true
            do {
                await this.loopFetch()
                await Utils.sleep(5000)
            } while (!this.finished)
        } catch (error) {
            this.log.err(`work start error: ${error}`)
            hasErr = true
        }
        if (this.vNeedStop) {
            await this._stop()
        }
        // 遇到错误退出程序，有可能的话重启进程
        if (hasErr) {
            try {
                await this.clear()
                await this.saveContext()
                this.log.info(`check need to restart: ${this.conf?.main?.alwaysRestart}`)
                if (this.conf?.main?.alwaysRestart) {
                    const count = await this.getRestartCount()
                    const waitSecond = 2 ** (parseInt(count) || 1)
                    this.log.warn(`-----wait ${waitSecond}s Restart Process -----`)
                    await Utils.sleep(waitSecond * 1000)
                    Utils.restartProcess()
                }
            } catch (error) {
                //pass
            }
            return
        }
        try {
            await this.execCode()
        } catch (error) {
            this.log.err(`execCode err: ${error.message}`)
        }
        await this.recover()
        await this.clear()
        this.log.info('Task finished')
    }
    async recover() {
        fs.writeFileSync(this.lastPageFile, `1`)
        fs.writeFileSync(this.reworkPagesFile, `[]`)
    }
    async initPageInfo() {
        await Utils.sleep(1000)
        this.pages = await this.getPages()
        if (this.pages == 0) this.pages = Config.DefaultMaxPages
        this.currentPage = await this.getCurrentPage()
        this.log.info(`last page: ${this.lastRunPage},current page: ${this.currentPage},pages: ${this.pages}`)
        if (this.lastRunPage > this.currentPage && this.lastRunPage <= this.pages) {
            this.currentPage = this.lastRunPage
            await this.goPage(this.currentPage)
        }
    }
    async loopFetch() {
        this.log.info('start fetch data')
        while (this.currentPage <= this.pages) {
            // 检查是否有停止信号
            if (this.vNeedStop) {
                await this._stop()
            }
            let hasErr = false
            try {
                const notDoneList = await this.getList()
                if (notDoneList.length > 0) hasErr = true
            } catch (error) {
                this.log.err(`loopFetch error: ${error.message}`)
                hasErr = true
            }
            if (this.vNeedStop) {
                await this._stop()
            }
            if (hasErr) {
                this.log.err(`loopFetch -> getList rework : ${this.currentPage}`);
                this.reworkPages.push(this.currentPage)
            }
            try {
                await this.goNext()
            } catch (error) {
                this.log.err(`loopFetch -> goNext : ${error.message}`)
                await this.openUrl()
                await this.goPage(this.currentPage--)
            }
            await Utils.sleep(Config.ListTimeInterval)
        }
        await this.subFetch()
        this.finished = true
    }
    async subFetch() {
        // 处理需要重新进行的列表页
        if (this.reworkPages.length > 0) {
            this.log.info(`start rework page : [${this.reworkPages}]`)
            for (let i = 0; i < this.reworkPages.length;) {
                const page = this.reworkPages[i]
                this.log.info(`rework page: ${page}`)
                let hasErr = false
                try {
                    await this.goPage(page)
                    this.log.info(`refetch data of : ${page} page`)
                    const notDoneList = await this.getList()
                    if (notDoneList.length > 0) {
                        hasErr = true
                    }
                } catch (error) {
                    hasErr = true
                }
                if (!hasErr) i++
                await Utils.sleep(1000)
            }

            this.reworkPages = []
        }
    }
    async goNext() {
        this.currentPage++
        if (this.pages < this.currentPage) return
        return this.goPage(this.currentPage)
    }
    async getList() {
        let list = await this.getListData()
        this.log.info(`fetch list data : length ${list.length} , ${this.currentPage}/${this.pages} pages`);
        const notDoneList = []
        for (const i in list) {
            // 检查是否有停止信号
            if (this.vNeedStop) {
                await this._stop()
            }
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
            const hasExist = await this.itemExist(id)
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
                await this.saveItemData(itemData, id)
            } catch (e) {
                this.log.err(`item data get error : ${e.message}`)
                notDoneList.push(id)
                continue
            }
            await Utils.sleep(this.conf.main.pageTimeInterval * 1000 || 500)
        }
        if (notDoneList.length == list.length) {
            this.vItemsErrIndex += 1
            const sleepTime = 10 ** this.vItemsErrIndex
            this.log.warn(`fetch item error, sleep ${sleepTime}s to continue!!`)
            await Utils.sleep(sleepTime * 1000)
        } else {
            this.vItemsErrIndex = 0
        }
        return notDoneList
    }
    async saveItemData(data, id) {
        if (this.storage.type == "file") {
            const file = path.join(this.saveDetailDataDir, `${id}.json`)
            await Utils.saveJson(data, file)
        } else {
            await this.storage.save('detail', {
                name: id,
                data: data
            })
        }
        this.log.info(`save item data of ${id}`)
    }
    async itemExist(id) {
        if (this.storage.type == "file") {
            const file = path.join(this.saveDetailDataDir, `${id}.json`)
            return await Utils.checkFile(file) === true
        } else {
            const res = await this.storage.query('detail', {
                name: id
            })
            return res.length === 1
        }
    }
    async exportData() {
        if (!this.storage) await this.initStorage()

        this.log.info('prepare to export data')
        // TODO: 使用用户自定义的导出函数
        // if(this.custom.exportData){
        //     return this.custom.exportData()
        // }
        let files = []
        if (this.storage.type == "file") {
            files = (await Utils.readDir(this.saveDetailDataDir))
                .filter(f => f.endsWith('.json'))
                .map(f => path.join(this.saveDetailDataDir, f))
        } else {
            // TODO: 不要一次性导出所有数据
            files = await this.storage.queryAsync('detail', {})
        }

        if (files.length == 0) {
            throw new Error('0 files can\'t save')
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
        try {
            await Utils.exportFile(endData, path.join(this.exportDataDirPath, 'export.json'), 'json')
            await Utils.exportFile(endData, path.join(this.exportDataDirPath, 'export.csv'), 'csv')
        } catch (error) {
            this.log.err(`export data failed:`, error.message)
        }
        this.log.info('data export success.')
        await this.storage.close()
    }
    async getLastPage() {
        const page = await Utils.readFile(this.lastPageFile)
        return parseInt(page) || 1
    }
    async importReworkPages() {
        const pagesString = await Utils.readFile(this.reworkPagesFile)
        try {
            const pages = JSON.parse(pagesString)
            if (pages?.length > 0) {
                this.reworkPages.push(...pages)
            }
        } catch (error) {
            throw new Error(`import rework pages error: ${pagesString}`)
        }
    }
    async getRestartCount() {
        if (!this.state?.RestartCount) {
            this.state.RestartCount = 1
        } else {
            this.state.RestartCount += 1
        }
        return this.state.RestartCount
    }
    async saveContext() {
        this.log.info(`Task will exit, save Context : current Page: ${this.currentPage}`)
        fs.writeFileSync(this.lastPageFile, `${this.currentPage}`)
        if (this.reworkPages.length > 0) {
            fs.writeFileSync(this.reworkPagesFile, JSON.stringify(this.reworkPages))
        }
        // save context state
        if (!this.vTestState) await this.saveState()

        // delete pid file
        fs.writeFileSync(this.taskPidPath, ``)
    }
    async _stop() {
        this.log.warn('检测到停止信号，业务暂停30s，等待程序停止')
        this.vCanStop = true
        await Utils.sleep(30000)
        this.log.warn('任务等待停止超时，强制停止进程')
        process.exit(1)
    }

    // 基础task方法
    /**
     * 返回task相关配置的路径
     */
    async getPath(key) {
        // TODO: 需要整理一下路径的代码
        const name = this[key] || this.#paths[key]
        if (!await Utils.checkFile(name)) {
            throw new Error(`${key} file not exist`)
        }
        return name
    }

    // interface of task
    /**
     * 获取任务进度状态信息
     */
    async getState() {
        if (this.driver.getState) return this.driver.getState()
        let state = {}
        try {
            state = await Utils.readJson(this.statePath)
        } catch (error) {
            // pass
        }
        return state
    }
    async saveState() {
        if (this.driver.saveState) return this.driver.saveState(this.state)
        if (this.state) await Utils.saveJson(this.state, this.statePath)
    }
    /**
     * 清除各种进程
     */
    async clear() {
        await this.driver.clear()
        if (this.storage) await this.storage.close()
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
    async execCode() {
        if(await Utils.checkFile(this.#paths["customExecCode"]) !== true) throw new Error(this.getMsg(5))
        this.log.info('start exec custom code')
        const customCode = require(this.#paths["customExecCode"])
        await customCode?.call(this)
    }
    //interface of process
    async runBefore() {
        if (this.conf.process?.CustomStage?.RunBefore) {
            await this.custom.runBefore()
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
        fs.writeFileSync(this.taskPidPath, `${process.pid}`)
    }
    #initValue() {
        const taskRootPath = this.conf.main.rootPath
        const taskDataPath = this.conf.main.dataPath
        // 最后一次访问的页
        this.lastPageFile = path.join(taskRootPath, `last_page.txt`)
        // 要重新获取的页
        this.reworkPagesFile = path.join(taskRootPath, `rework_pages.json`)
        this.exportDataDirPath = path.join(taskDataPath, 'export')
        this.saveDetailDataDir = path.join(taskDataPath, 'detail')
        this.taskPidPath = path.join(taskRootPath, 'task.pid')
        this.infoLogPath = path.join(taskRootPath, 'log/info.log')
        this.errLogPath = path.join(taskRootPath, 'log/err.log')
        this.statePath = path.join(taskRootPath, 'task_state.json')
        this.#paths['customExecCode'] = path.join(taskRootPath, 'custom_exec_code.js')
        this.customExportData = path.join(taskRootPath, 'custom_export_data.js')
        this.#paths['overwriteCode'] = path.join(taskRootPath, 'custom_over_write_code.js')

        this.currentPage = 1
        this.pages = 1
        this.state = null

        this.reworkPages = []
        this.finished = false
        // 临时状态设置
        this.vItemsErrIndex = 0
        // 发出可以停止信号
        this.vCanStop = false
        // 外界发出关闭指令，内法发出需要停止信号，通知相关流程暂停运行，等待程序关闭
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
            const driverClass = require(`./drivers/${this.conf.main?.useDriver || 'selenium'}`)
            return new driverClass({
                conf: this.conf
            })
        } catch (error) {
            throw new Error(`can't load custom driver module : ${error.message}`)
        }
    }
    #setCustomCode() {
        try {
            return require(this.#paths['overwriteCode'])
        } catch (e) {
            throw new Error(`setCustomCode error : ${e.message}`)
        }
    }
    get helper(){
    	return {
            getDedailList : async () => {
        		const files = await Utils.readDir(this.saveDetailDataDir)
        		return files.filter(e => e.endsWith('.json'))
        	},
        	getExportJsonData : async () => {
        		return Utils.readJson(path.join(this.exportDataDirPath, 'export.json'))
        	},
        	download : Utils.listDownload
        }
    }
}

module.exports = Task
