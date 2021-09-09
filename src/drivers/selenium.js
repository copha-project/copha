// eslint-disable-next-line no-unused-vars
const path = require('path')
const Utils = require('uni-utils')
// eslint-disable-next-line no-unused-vars
const { By, until, Key } = require('selenium-webdriver')
const Driver = require('../class/driver')
const webdriver = require('selenium-webdriver')
const proxy = require('selenium-webdriver/proxy')
const firefox = require('selenium-webdriver/firefox')
const chrome = require('selenium-webdriver/chrome')
const { Builder } = require('selenium-webdriver')

class Selenium extends Driver {
    DriverModule = require('selenium-webdriver')
    constructor(conf) {
        super(conf)
    }
    // core process
    async init() {
        try {
            let driverBuilder = new Builder()
            this.setBrowser(driverBuilder)
            // driverBuilder.usingServer('http://127.0.0.1:50011')
            // console.log(driverBuilder);
            this.setOptions(driverBuilder)
            // this.setPreference(driverBuilder)
            // this.setProxy(driverBuilder)
            this.setDriver(await driverBuilder.build())

            if(this.conf.main.driver == 'chrome'){
                const service = chrome.getDefaultService()
                this.log.debug(`Chrome driverService on : ${await service.address()}`)
            }

            await this.driver.manage().setTimeouts(
                {
                    pageLoad: this.appSettings?.Driver?.Time?.PageLoadTimeout || 1000,
                    implicit: 10000
                }
            )

            console.log('close win');
            // await this.driver.close()
            // this.driver.session_.then(e=>{e.id_='45464456981325fe775059d49db180ce'})

            // console.log();

        } catch (error) {
            console.log(error);
            throw new Error(`Driver init failed : ${error}`)
        }
        this.log.info('web driver init end')
    }
    setBrowser(driverBuilder){
        driverBuilder.forBrowser(this.conf.main?.driver || 'firefox')
    }
    setOptions(driverBuilder){
        let options = null
        switch (this.conf.main?.driver) {
            case 'chrome':
                {
                    options = new chrome.Options()
                    if(this.conf.main?.browserProfile){
                        options.addArguments(this.conf.main.browserProfile)
                    }
                    // options.setPreference("network.proxy.socks_remote_dns", true)
                    driverBuilder.withCapabilities(webdriver.Capabilities.chrome())
                        .setChromeOptions(options)
                }
                break;
            default:
                {
                    options = new firefox.Options()
                    if(this.conf.main.useProxy){
                        options.setPreference("network.proxy.socks_remote_dns", true)
                    }
                    driverBuilder.withCapabilities(webdriver.Capabilities.firefox())
                        .setFirefoxOptions(options)
                }
        }
        if(this.getEnv("COPHA_SHOW_HEADLESS_GUI")){

        }else{
            if (this.conf.main.debug) {

            }else{
                options.headless()
            }
        }

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
    setPreference(driverBuilder){

    }
    async open(url, ignoreErr=false) {
        url = url || this.conf.main?.targetUrl
        // 3次重试
        const maxCount = 3
        let count = 1
        try {
            await this.driver.get(url)
        } catch (error) {
            while (count <= maxCount && !ignoreErr) {
                this.log.warn(`refresh it again ${count}/${maxCount}`)
                try {
                    await this.driver.get(url)
                    break
                } catch (error) {
                    this.log.err(`open url err: ${error}`)
                    count++
                }
            }
        }
        if (count == 4 && !ignoreErr) {
            throw new Error('open url failed, task stoped')
        }
    }
    async clear() {
        if (this.driver) {
            try {
                await this.driver.quit()
            } catch (error) {
                this.log.err(`clear web driver err: ${error.message}`)
            } finally{
                this.driver = null
            }
        }
    }
    async sleep(n) {
        return this.driver.sleep(n)
    }

    buildSelector(k,v){
        return By[k](v)
    }
    getKey(name){
        return Key[name.toUpperCase()]
    }
    async findElements(v){
        return this.driver.findElements(v)
    }
    async findElement(v){
        return this.driver.findElement(v)
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
    async clearTab(){
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
