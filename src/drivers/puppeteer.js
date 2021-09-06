const path = require('path')
const Uni = require('uni-utils')

const Driver = require('../class/driver')
const puppeteer = require('puppeteer')

class Puppeteer extends Driver {
    DriverModule = require('puppeteer')
    #conf = null
    #web_page = null
    constructor(conf) {
        super(conf)
        this.#conf = conf
    }
    async init(){
        // await page.screenshot({ path: 'example.png' });
      
        this.driver = await puppeteer.launch()
        this.#web_page = await this.driver.newPage()
    }
    async clear(){
        return this.driver.close()
    }
    async closeTab(){

    }
    async open(url){
        return this.#web_page.goto(url)
    }
}