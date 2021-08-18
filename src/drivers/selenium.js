// eslint-disable-next-line no-unused-vars
const path = require('path')
const Utils = require('uni-utils')
// eslint-disable-next-line no-unused-vars
const { By, until, Key } = require('selenium-webdriver')
const { Sequelize } = require('sequelize')
const Base = require('../class/base')
const webdriver = require('selenium-webdriver')
const proxy = require('selenium-webdriver/proxy')
const firefox = require('selenium-webdriver/firefox')
const chrome = require('selenium-webdriver/chrome')
const { Builder } = require('selenium-webdriver')

class Selenium extends Base {
    constructor({ conf }) {
        super(conf)
        this.conf = conf
        this.processConfig = conf.process
        this.driver = null
        this.custom = null
    }
    setTestState(bol) {
        this.vTestState = bol
    }
    setCustom(custom){
        this.custom = custom
    }
    // core process
    async initDriver() {
        try {
            const options = this.configOptions()
            const driverBuilder = await this.getDriverBuilder(options)
            this.setProxy(driverBuilder)
            this.driver = driverBuilder.build()
            await this.driver.manage().setTimeouts({ pageLoad: 30000, implicit: 10000 })
        } catch (error) {
            throw(Error(`Driver init failed : ${error.message}`))
        }
        this.log.info('web driver init end')
    }
    getDriverBuilder(options){
        let driverBuilder = new Builder()
        switch (this.conf.main?.driver) {
            case 'chrome':
                {
                    driverBuilder.withCapabilities(webdriver.Capabilities.chrome())
                        .setChromeOptions(options)
                }
                break;
            default:
                {
                    driverBuilder.withCapabilities(webdriver.Capabilities.firefox())
                        .setFirefoxOptions(options)
                }
        }
        return driverBuilder
    }
    configOptions(){
        let options = null
        switch (this.conf.main?.driver) {
            case 'chrome':
                {
                    options = new chrome.Options()
                    // options.setPreference("network.proxy.socks_remote_dns", true)
                }
                break;
            default:
                {
                    options = new firefox.Options()
                    options.setPreference("network.proxy.socks_remote_dns", true)
                }
        }
        if(this.getEnv("COPHA_SHOW_HEADLESS_GUI")){

        }else{
            if (this.conf.main.debug) {

            }else{
                options.headless()
            }
        }
        return options
    }
    setProxy(driverBuilder){
        const _setProxy = () => {
            driverBuilder.setProxy(proxy.socks('127.0.0.1:1086', 5))
            this.log.warn('Task run with proxy !!!')
        }
        if(process.env['COPHA_USE_PROXY']){
            _setProxy()
        }else{
            if (this.conf.main.useProxy) {
                _setProxy()
            }
        }
    }
    setPreference(){

    }
    async openUrl(url) {
        // 3次重试
        const maxCount = 3
        let count = 1
        try {
            await this.driver.get(url||this.conf.main.targetUrl)
        } catch (error) {
            while (count <= maxCount) {
                this.log.warn(`refresh it again ${count}/${maxCount}`)
                try {
                    await this.driver.navigate().refresh()
                    break
                } catch (error) {
                    this.log.err(`openUrl err: ${error.message}`)
                    count++
                    await Utils.sleep(1000)
                }
            }
        }
        if (count == 4) {
            throw new Error('open url failed, task stoped')
        }
    }
    async clear() {
        if (this.driver) {
            try {
                this.driver.quit()
            } catch (error) {
                this.log.err(`clear web driver err: ${error.message}`)
            } finally{
                this.driver = null
            }
        }
    }
    // custom process
    async runBefore() {
        this.log.info('start exec runbefore()')
    }
    async runTest() {
        this.log.info(`run test:`)
        try {
            let currentPage = 1
            if (this.processConfig?.Test?.GetCurrentPage) {
                this.log.info('run test for getCurrentPage:')
                currentPage = await this.getCurrentPage()
                this.log.info(`GetCurrentPage done: ${currentPage}`)
            }

            if (this.processConfig?.Test?.GoPage) {
                this.log.info('run test for goPage:')
                await this.goPage(currentPage+2)
                this.log.info(`goPage ok\n`)
            }

            if (this.processConfig?.Test?.GetPages) {
                this.log.info('run test for GetPages:')
                const pages = await this.getPages()
                this.log.info(`getPages ok: ${pages}\n`)
            }

            let list = []
            if (this.processConfig?.Test?.GetListData) {
                this.log.info('run test for getListData:')
                list = await this.getListData()
                this.log.info(`getListData ok : ${list.length}\n`)
            }
            if (this.processConfig?.Test?.GetItemId) {
                this.log.info('run test for getItemId:')
                const itemId = await this.getItemId(list[0])
                this.log.info(`getItemId ok : ${itemId}\n`)
            }
            if (this.processConfig?.Test?.GetItemData) {
                this.log.info('run test for getItemData:')
                const itemData = await this.getItemData(list[0])
                this.log.info(`getItemData ok : ${itemData}\n`)
            }
        } catch (error) {
            this.log.err(`test error result : ${error}`);
        }
        this.log.info(`test end.`)
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
                    const goInput = await this.driver.findElement(By.xpath(methodInfo.value))
                    // await driver.executeScript(`document.getElementsByClassName('default_pgCurrentPage').item(0).setAttribute('value',${page})`)
                    await goInput.clear()
                    if(methodInfo.clickOk){
                        const okElement = await this.driver.findElement(By.xpath(methodInfo.clickOk))
                        if(!okElement) throw(Error(`not find click ok element!`))
                        await goInput.sendKeys(page)
                        await okElement.click()
                    }else{
                        await goInput.sendKeys(page, Key.ENTER)
                    }
                }
                break;
        }

        let checkFunc = this.getCurrentPage.bind(this)

        if(goPageInfo?.customCheck?.enable){
            this.log.info('invoke custom check for goPgae')
            const customCheck = goPageInfo?.customCheck
            checkFunc = async () => {
                let checkItem = await this.driver.findElements(By[customCheck.type](customCheck.value))
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
            await this.driver.sleep(500)
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
                    pages = await this.driver.findElement(By.xpath(pagesInfo.value)).getText()
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
                    const selector = await this.driver.findElement(By.css(pagesInfo.value))
                    if(pagesInfo?.attr){
                        pages = await selector.getAttribute(pagesInfo.attr)
                    }else{
                        pages = await selector.getText()
                    }
                }
                break
            case 'id':
                pages = await this.driver.findElement(By.id(pagesInfo.value)).getText()
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
                    page = await this.driver.findElement(By.xpath(theWayInfo.value))
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
                    const selector = await this.driver.findElement(By.css(theWayInfo.value))
                    if(theWayInfo?.attr){
                        page = await selector.getAttribute(theWayInfo.attr)
                    }else{
                        page = await selector.getText()
                    }
                }
                break
            case 'id':
                {
                    page = await this.driver.findElement(By.id(theWayInfo.value)).getText()
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
                        let clickItem = await item.findElements(By[fetchContentInfo.selector.type](fetchContentInfo.selector.value))
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
                    await this.driver.sleep(1000)

                    let content = []
                    switch (clickContentInfo.type) {
                        case "custom":
                            content = await this.custom?.getItemContent()
                            break;
                        default:
                            {
                                content = await this.driver.findElements(By[clickContentInfo.type](clickContentInfo.value))
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
                    await this.driver.sleep(1000)
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
        let selector = By.xpath(locValue)
        switch (this.processConfig.GetItemId?.selector?.type) {
            case "id":
                selector = By.id(locValue)
                break;
            case "css":
                selector = By.css(locValue)
                break
            case "xpath":
                selector = By.xpath(locValue)
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
        let selector = By.xpath(locValue)
        switch (this.processConfig.GetItemData?.selector?.type) {
            case "id":
                selector = By.id(locValue)
                break;
            case "css":
                selector = By.css(locValue)
                break
            default:
                // xpath
                break;
        }
        return selector
    }
    getListSelector() {
        const locValue = this.processConfig.GetListData?.selector?.value
        let selector = By.xpath(locValue)
        switch (this.processConfig.GetListData?.selector?.type) {
            case "id":
                selector = By.id(locValue)
                break;
            case "css":
                selector = By.css(locValue)
                break
            default:
                // xpath
                break;
        }
        return selector
    }
    // eslint-disable-next-line no-unused-vars
    async waitTwoTab() {
        const maxCount = 30
        const waitTime = 1000
        let count = 1
        while (count <= maxCount) {
            await this.driver.sleep(waitTime)
            const whs = await this.driver.getAllWindowHandles()
            if (whs.length == 2) return
            if(whs.length>2){
                // try {
                //     this._clearTab()
                // } catch (e) {
                //     this.log.err(`_clearTab err: ${e.message}`)
                // }
                throw new Error(`waitTwoTab error: tab nums ${whs.length}`)
            }
            count++
        }
        throw new Error('waitTwoTab error: timeout')
    }
    async waitExecFunc(funcName) {
        const maxCount = 3
        const waitTime = 1000
        let count = 1
        while (count <= maxCount) {
            const funcExist = await this.driver.executeScript((f) => eval("typeof " + f), funcName)
            if (funcExist == 'function') return
            count++
            await this.driver.navigate().refresh()
            await this.driver.sleep(waitTime)
        }
        this.log.err('not find function: ', funcName)
    }
    async swithToNewTab(){
        const whs = await this.driver.getAllWindowHandles()
        await this.driver.switchTo().window(whs[1])
        // await driver.wait(until.elementLocated(By.xpath(fields_xpath[0])), 30000)
    }
    async closeCurrentTab() {
        const whs = await this.driver.getAllWindowHandles()
        await this.driver.close()
        await this.driver.switchTo().window(whs[0])
    }
    async _clearTab(){
        const whs = await this.driver.getAllWindowHandles()
        for (let i = 1; i < whs.length; i++) {
            await this.driver.switchTo().window(whs[i])
            await this.driver.close()
        }
        await this.driver.switchTo().window(whs[0])
    }
    async waitPage(p, driver) {
        const min_xpath = `//*[@id="pagetest2"]/table/tbody/tr/td/table/tbody/tr/td[11]/span[1]`
        const max_xpath = `//*[@id="pagetest2"]/table/tbody/tr/td/table/tbody/tr/td[11]/span[2]`
        const min_num = parseInt(await (await driver.findElement(By.xpath(min_xpath))).getText())
        const max_num = parseInt(await (await driver.findElement(By.xpath(max_xpath))).getText())
        const waitTime = 1000
        let count = 10
        while (count !== 0) {
            if (min_num < p && p <= max_num) break
            await driver.sleep(waitTime)
            if (count == 0) {
                throw new Error('wait page error')
            }
            count--
        }
    }
}

module.exports = Selenium
