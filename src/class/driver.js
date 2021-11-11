const Base = require("./base")
const Utils = require('uni-utils')
const Core = require('./core')

class Driver extends Base {
    DriverModule = this
    #projectConfig = null
    #config = null
    #driver = this
    constructor(){
        super()
    }

    setConfig(projectConfig){
        this.#projectConfig = projectConfig
        this.#config = projectConfig.Driver || {}
    }

    static CONFIG = {}
    async init(){}

    async getProxy(){
        return Core.getInstance().getProxy(this.#projectConfig?.Proxy?.SelectIndex || 0)
    }

    async clear(){}
    async open(){
        throw new Error(this.getMsg(10,'must implement open()'))
    }
    async closeTab(){}
    async quit(){}

    async sleep(n){
        return Utils.sleep(n)
    }

    get conf(){
        return this.#config
    }
    get driver(){
        return this.#driver
    }
    set driver(v){
        this.#driver = v
    }

    // return key of keyboard
    getKey(name){}
    // k is css xpath id js ...
    buildSelector(k,v){
        throw new Error(this.getMsg(10,'must implement buildSelector()'))
    }

    async getTitle(){
        throw new Error(this.getMsg(10,'getTitle()'))
    }

    async getCurrentUrl(){
        throw new Error(this.getMsg(10,'getCurrentUrl()'))
    }

    async findElements(){
        throw new Error(this.getMsg(10,'findElements()'))
    }
    async findElement(){
        throw new Error(this.getMsg(10,'findElement()'))
    }

    // method not need change, they has be implement by above method
    buildSelectorForId(v){
        return this.buildSelector('id', v)
    }
    buildSelectorForXpath(v){
        return this.buildSelector('xpath', v)
    }
    buildSelectorForCss(v){
        return this.buildSelector('css', v)
    }

    async findElementBy(k,v){
        return this.findElement(this.buildSelector(k,v))
    }
    async findElementByXpath(v){
        return this.findElementBy('xpath',v)
    }
    async findElementByCss(v){
        return this.findElementBy('css',v)
    }
    async findElementById(v){
        return this.findElementBy('id',v)
    }

    async findElementsBy(k,v){
        return this.findElements(this.buildSelector(k,v))
    }
    async findElementsByCss(v){
        return this.findElementsBy('css',v)
    }
    async findElementsByXpath(v){
        return this.findElementsBy('xpath',v)
    }
}

module.exports = Driver
