const Utils = require('uni-utils')
const { Job } = require('copha')

class ListJob extends Job {
    constructor(taskConf) {
        super('list_fetch',taskConf)
        this.#initValue()
    }
    #initValue() {
        this.processConfig = this.conf

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
    async runTest(){
        console.log(this.getJobFile('rework_pages.json'));
        // let currentPage = 1
        // if (this.conf?.Test?.GetCurrentPage) {
        //     this.log.info('run test for getCurrentPage:')
        //     currentPage = await this.getCurrentPage()
        //     this.log.info(`GetCurrentPage done: ${currentPage}`)
        // }
        //
        // if (this.conf?.Test?.GoPage) {
        //     this.log.info('run test for goPage:')
        //     await this.goPage(currentPage+2)
        //     this.log.info(`goPage ok\n`)
        // }
        //
        // if (this.conf?.Test?.GetPages) {
        //     this.log.info('run test for GetPages:')
        //     const pages = await this.getPages()
        //     this.log.info(`getPages ok: ${pages}\n`)
        // }
        //
        // let list = []
        // if (this.conf?.Test?.GetListData) {
        //     this.log.info('run test for getListData:')
        //     list = await this.getListData()
        //     this.log.info(`getListData ok : ${list.length}\n`)
        // }
        // if (this.conf?.Test?.GetItemId) {
        //     this.log.info('run test for getItemId:')
        //     const itemId = await this.getItemId(list[0])
        //     this.log.info(`getItemId ok : ${itemId}\n`)
        // }
        // if (this.conf?.Test?.GetItemData) {
        //     this.log.info('run test for getItemData:')
        //     const itemData = await this.getItemData(list[0])
        //     this.log.info(`getItemData ok : ${itemData}\n`)
        // }

        this.log.info(`test end.`)
    }
    async run(){
        this.log.info(this.getMsg(7,this.taskName))
        await this.#loadState()
        await this.#initPageInfo()
        this.vStartState = true
        do {
            await this.#listFetch()
            await this.checkNeedStop()
            await Utils.sleep(5000)
        } while (!this.finished)
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
            await this.checkNeedStop()
            try {
                const notDoneList = await this.#doList()
                if (notDoneList.length > 0) {
                    throw new Error('do list not complete')
                }
            } catch (error) {
                this.log.err(`listFetch -> getList rework : ${this.currentPage}, ${error.message}`);
                this.reworkPages.push(this.currentPage)
            }
            await this.checkNeedStop()
            try {
                await this.#goNext()
            } catch (error) {
                this.log.err(`listFetch -> goNext : ${error.message}`)
                await this.driver.open()
                await this.goPage(this.currentPage--)
            }
            await Utils.sleep(this.conf.ListTimeInterval)
        }
        // await this.#subFetch()
        this.finished = true
    }
    async #subFetch() {}
    async #doList() {
        let list = await this.getListData()
        this.log.info(`fetch list data : length ${list.length} , ${this.currentPage}/${this.pages} pages`);
        const notDoneList = []
        for (const i in list) {
            // 检查是否有停止信号
            await this.checkNeedStop()
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
            await Utils.sleep(this.conf?.pageTimeInterval * 1000 || 500)
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
    }

    async importReworkPages() {
        const pagesString = await Utils.readFile(this.getJobFile('rework_pages.json'))
        try {
            const pages = JSON.parse(pagesString)
            if (pages?.length > 0) {
                this.reworkPages.push(...pages)
            }
        } catch (error) {
            throw new Error(`import rework pages error: ${pagesString}`)
        }
    }

    async #initPageInfo() {
        await Utils.sleep(1000)
        this.pages = await this.getPages()
        if (this.pages == 0) this.pages = this.conf.DefaultMaxPages
        this.currentPage = await this.getCurrentPage()
        this.log.info(`last page: ${this.lastRunPage},current page: ${this.currentPage},pages: ${this.pages}`)
        if (this.lastRunPage > this.currentPage && this.lastRunPage <= this.pages) {
            this.currentPage = this.lastRunPage
            await this.goPage(this.currentPage)
        }
    }
    async #getLastPage() {
        const page = await Utils.readFile(this.getJobFile('last_page.txt'))
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
        let state = {}
        try {
            state = await Utils.readJson(this.getPath('state'))
        } catch (error) {
            // pass
        }
        return state
    }
    async saveState() {
        if (this.state) await Utils.saveJson(this.state, this.getPath('state'))
    }

    async goPage(page) {
        const goPageInfo = this.processConfig.GoPage
        switch (goPageInfo?.type) {
            case 'url':
                {
                    const methodInfo = goPageInfo.method.url
                    await this.driver.executeScript(
                        `window.location.href="${methodInfo.value.replace('#p', page)}"`
                    )
                }
                break;
            case 'function':
                {
                    const methodInfo = goPageInfo.method.func
                    await this.waitExecFunc(methodInfo.value)
                    await this.driver.executeScript(`${methodInfo.value}()`)
                }
                break
            default:
                {
                    const methodInfo = goPageInfo.method.click
                    const goInput = await this.driver.findElementByXpath(methodInfo.value)
                    // await driver.executeScript(`document.getElementsByClassName('default_pgCurrentPage').item(0).setAttribute('value',${page})`)
                    await goInput.clear()
                    if(methodInfo.clickOk){
                        const okElement = await this.driver.findElementByXpath(methodInfo.clickOk)
                        if(!okElement) throw(Error(`not find click ok element!`))
                        await goInput.sendKeys(page)
                        await okElement.click()
                    }else{
                        await goInput.sendKeys(page, this.driver.getKey('enter'))
                    }
                }
                break;
        }

        let checkFunc = this.getCurrentPage

        if(goPageInfo?.customCheck?.enable){
            this.log.info('invoke custom check for goPgae')
            const customCheck = goPageInfo?.customCheck
            checkFunc = async () => {
                let checkItem = await this.driver.findElementsBy(customCheck.type,(customCheck.value))
                if(customCheck.display){
                    if(checkItem.length==0) return -1
                }else{
                    if(checkItem.length>0) return -1
                }
                return this.getCurrentPage()
            }
        }

        let p = -1
        let count = 1
        if(count > 1) this.log.warn("start waitting page")
        do {
            await Utils.sleep(500)
            try {
                p = await checkFunc()
            } catch (error) {
                this.log.err(`checkFunc error: ${error}`)
                count += 10
            }
            if (count > 100) throw new Error(`not go page: ${page}`)
            count++

        } while (page != p)
    }
    async getPages() {
        let pages = 1
        const pagesInfo = this.processConfig.GetPages[this.processConfig?.GetPages?.use]
        switch (this.processConfig?.GetPages?.use) {
            case 'number':
                pages = parseInt(pagesInfo.value)
                break;
            case 'xpath':
                {
                    pages = await this.driver.findElementByXpath(pagesInfo.value).getText()
                    if (pagesInfo.regexp) {
                        try {
                            pages = parseInt(new RegExp(pagesInfo.regexp).exec(pages)[1])
                        } catch (error) {
                            throw new Error('can not parse pages text:' + pagesInfo.regexp)
                        }
                    }
                    break
                }
            case 'css':
                {
                    const selector = await this.driver.findElementByCss(pagesInfo.value)
                    if(pagesInfo?.attr){
                        pages = await selector.getAttribute(pagesInfo.attr)
                    }else{
                        pages = await selector.getText()
                    }
                }
                break
            case 'id':
                pages = await this.driver.findElementById(pagesInfo.value).getText()
                break
            default:
                break;
        }
        return parseInt(pages)
    }
    async getCurrentPage() {
        let page = 1
        const usageWay = this.processConfig?.GetCurrentPage?.use
        const theWayInfo = this.processConfig?.GetCurrentPage[usageWay]
        switch (usageWay) {
            case 'number':
                page = parseInt(theWayInfo.value)
                break;
            case 'xpath':
                {
                    page = await this.driver.findElementsByXpath(theWayInfo.value)
                    page = await page.getText()
                    if (theWayInfo?.regexp) {
                        try {
                            page = parseInt(new RegExp(theWayInfo.regexp).exec(page)[1])
                        } catch (error) {
                            throw new Error('can not get current page:' + page)
                        }
                    }
                    break
                }
            case 'css':
                {
                    const selector = await this.driver.findElementByCss(theWayInfo.value)
                    if(theWayInfo?.attr){
                        page = await selector.getAttribute(theWayInfo.attr)
                    }else{
                        page = await selector.getText()
                    }
                }
                break
            case 'id':
                {
                    page = await this.driver.findElementById(theWayInfo.value).getText()
                }
                break
            case 'url':
                {
                    const url = await this.driver.getCurrentUrl()
                    if (theWayInfo.regexp) {
                        try {
                            const regParse = new RegExp(theWayInfo.regexp).exec(url)
                            if(!regParse || regParse.length<2) throw(Error(`RegExp error: ${regParse}`))
                            page = parseInt(regParse[1])
                        } catch (error) {
                            throw(Error(`can not get current page from url: ${url} , ${error.message}`))
                        }
                    }
                }
                break
            default:
                break;
        }
        if (!parseInt(page)) throw new Error('get current page but the value don\'t look right : ' + page)
        return parseInt(page)
    }
    async getListData() {
        // 通过配置项来决定怎么获取列表内容，默认设置使用xpath的findElements
        let resList = await this.driver.findElements(this.getListSelector())
        if (this.processConfig.GetListData?.skipRow) {
            resList = resList.slice(this.processConfig.GetListData.skipRow)
        }
        if(this.processConfig.GetListData?.mergeItem?.enable){
            const mergeCounts = this.processConfig.GetListData?.mergeItem.count
            resList = Array.from(resList.map((e,i)=>{
                if(i>0 && (i+1) % mergeCounts == 0){
                    return resList.slice(i-mergeCounts+1,i+1)
                }
            }).filter(e=>e))
        }
        return resList
    }
    async getItemData(item) {
        let itemData = []
        // 处理特殊情况下的 item
        if(Array.isArray(item)){
            for (const field of item) {
                itemData.push(await field.getText())
            }
            itemData.id = itemData.join('_')
            return itemData;
        }
        const fields = await item.findElements(this.getItemSelector())
        // 传递id给后面操作使用
        itemData.id = await this.getItemId(item)
        itemData.push(itemData.id)
        for (const i in fields) {
            // if ([0].includes(parseInt(i))) continue
            const field = fields[i]
            let text = await field.getText()
            text = text.trim().replace(/[\n]/g,'\\n')
            itemData.push(text||'')
        }
        await this.getExtraContent(itemData)


        // download ?
        // if(itemData.length==8){
        //     const url = itemData[itemData.length-1].replace(`/license-biz/resources/1.0.0/js/plugins/Pdfjs/web/viewer.html?file=`,'').replace(/"/g,'')
        //     const savePath = path.join(this.conf.main.dataPath,'download',`${itemData[0].replace(/"/g,'')}-${itemData[1].replace(/"/g,'')}.pdf`)
        //     if(await Utils.checkFile(savePath)) {
        //
        //     }else{
        //         this.log.info('download file:',url)
        //         const resp = await require('node-fetch')(new URL(url),{timeout:20000})
        //         const pipeline = require('util').promisify(require('stream').pipeline)
        //         const saveFile = require('fs').createWriteStream(savePath)
        //         await pipeline(resp.body, saveFile)
        //
        //         // await Utils.download(url,{
        //         //     savePath: savePath
        //         // })
        //     }
        // }
        return itemData
    }
    async getExtraContent(itemData){
        if(!this.processConfig.GetItemData?.extraContent) return
        this.log.info('do some for extra Content')
        const itemConfig = this.processConfig.GetItemData?.content
        const contentFetchType = itemConfig?.use
        switch (contentFetchType) {
            case 'url':
                {
                    const fetchContentInfo = itemConfig.method.url
                    let url = fetchContentInfo.value
                    for (const p of fetchContentInfo.params) {
                        url = url.replace('#p', itemData[p])
                    }
                    const downContent = await Utils.download(url)
                    const parseTask = fetchContentInfo?.xmlParse
                    if (parseTask) {
                        switch (parseTask.type) {
                            case 'cheerio':
                                {
                                    const $ = require('cheerio').load(downContent)
                                    itemData = Array.from($(parseTask.value).map((i, e) => $(e).text()))
                                    break
                                }
                            default:
                                throw new Error('unknown type for parse')
                        }
                    }
                }
                break;
            case 'click':
                {
                    const fetchContentInfo = itemConfig.method.click
                    try {
                        await this._clearTab()
                    } catch (e) {
                        this.log.err(`_clearTab err: ${e.message}`)
                        throw(`_clearTab err: ${e.message}`)
                    }
                    if(fetchContentInfo.selector.type=='self'){
                        await item.click()
                    }else{
                        let clickItem = await item.findElementsBy(fetchContentInfo.selector.type,fetchContentInfo.selector.value)
                        if(clickItem.length!=1) break
                        clickItem = clickItem[0]

                        await clickItem.click()
                    }
                    if(fetchContentInfo.newTab) {
                        await this.waitTwoTab()
                        await this.swithToNewTab()
                    }
                    // 处理新的页面数据
                    const clickContentInfo = fetchContentInfo.contentSelector
                    await Utils.sleep(1000)

                    let content = []
                    switch (clickContentInfo.type) {
                        case "custom":
                            content = await this.custom?.getItemContent()
                            break;
                        default:
                            {
                                content = await this.driver.findElementsBy(clickContentInfo.type,(clickContentInfo.value))
                            }
                    }
                    if(itemConfig?.replace){
                        itemData = [itemData[0]]
                    }
                    for (const item of content) {
                        if ((await item?.getTagName()).toLowerCase() === 'a'){
                            itemData.push(await item.getAttribute('href'))
                        }
                        if (clickContentInfo?.attr){
                            itemData.push(await item.getAttribute(clickContentInfo.attr))
                        }else{
                            itemData.push(await item.getText())
                        }
                    }
                    console.log(itemData[itemData.length-1]);
                    await Utils.sleep(1000)
                    // 关闭或者返回
                    if(fetchContentInfo.newTab){
                        await this.closeCurrentTab()
                    }else{
                        await this.driver.navigate().back()
                    }
                }
            default:
                // pass
        }
    }
    async getItemId(item) {
        let id = ''
        if(Array.isArray(item)){
            const itemData = []
            for (const field of item) {
                itemData.push(await field.getText())
            }
            id = itemData.join('_')
            return  id;
        }
        const locValue = this.processConfig.GetItemId?.selector?.value
        let selector = this.driver.buildSelectorForXpath('locValue')
        switch (this.processConfig.GetItemId?.selector?.type) {
            case "id":
                selector = this.driver.buildSelectorForId(locValue)
                break;
            case "css":
                selector = this.driver.buildSelectorForCss(locValue)
                break
            case "xpath":
                selector = this.driver.buildSelectorForXpath(locValue)
                break
            case "page":
                return this.getCurrentPage()
                break
            default:
                return item.getText()
                break;
        }
        const items = await item.findElements(selector)
        if (items.length !== 1) throw new Error('not find id of item!')

        if(await items[0].getTagName() === 'a'){
            id = await items[0].getAttribute('href')
        }else{
            id = await items[0].getText()
        }
        if(this.processConfig.GetItemId?.regexp){
            id = new RegExp(this.processConfig.GetItemId?.regexp).exec(id)[1]
        }
        id = id.trim().replace(/[\s/]/g, '_')
        if (this.processConfig.GetItemId?.startWithIdx){
            id = `${item._idx}_${id}`
        }
        return id
    }

    getItemSelector() {
        const locValue = this.processConfig.GetItemData?.selector?.value
        let selector = this.driver.buildSelectorForXpath(locValue)
        switch (this.processConfig.GetItemData?.selector?.type) {
            case "id":
                selector = this.driver.buildSelectorForId(locValue)
                break;
            case "css":
                selector = this.driver.buildSelectorForCss(locValue)
                break
            default:
                // xpath
                break;
        }
        return selector
    }
    getListSelector() {
        const locValue = this.processConfig.GetListData?.selector?.value
        let selector = this.driver.buildSelectorForXpath(locValue)
        switch (this.processConfig.GetListData?.selector?.type) {
            case "id":
                selector = this.driver.buildSelectorForId(locValue)
                break;
            case "css":
                selector = this.driver.buildSelectorForCss(locValue)
                break
            default:
                // xpath
                break;
        }
        return selector
    }
}

module.exports = ListJob
