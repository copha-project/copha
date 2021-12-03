import Base from './base'
const Utils = require('uni-utils')
const Core = require('./core')

class Driver extends Base {
    DriverModule = this
    private _projectConfig: ProjectConfig
    private config = null
    private _driver = this
    constructor(){
        super()
    }

    setConfig(projectConfig){
        this._projectConfig = projectConfig
        this.config = projectConfig.Driver || {}
    }

    static CONFIG = {}
    async init(){}

    async getProxy(){
        return Core.getInstance().getProxy(this._projectConfig?.Proxy?.SelectIndex || 0)
    }

    async clear(){}

    async open(){
        throw new Error(this.getMsg(10,'must implement open()'))
    }
    
    async reload(){
        throw new Error(this.getMsg(10,'must implement reload()'))
    }

    async closeTab(){}
    
    async quit(){}

    async sleep(n){
        return Utils.sleep(n)
    }

    get projectConfig(){
        return this._projectConfig
    }

    get conf(){
        return this.config
    }

    get driver(){
        return this._driver
    }

    set driver(v){
        this._driver = v
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

    async findElements(selector){
        throw new Error(this.getMsg(10,'findElements()'))
    }
    async findElement(selector){
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

    async findElementBy(k, v, target){
        if(target){
            return target.findElement(this.buildSelector(k,v))
        }
        return this.findElement(this.buildSelector(k,v))
    }
    async findElementByXpath(v, target){
        return this.findElementBy('xpath', v, target)
    }
    async findElementByCss(v, target){
        return this.findElementBy('css', v, target)
    }
    async findElementById(v, target){
        return this.findElementBy('id', v, target)
    }

    async findElementsBy(k, v, target){
        if(target){
            return target.findElements(this.buildSelector(k,v))
        }
        return this.findElements(this.buildSelector(k,v))
    }
    async findElementsByCss(v, target){
        return this.findElementsBy('css', v, target)
    }
    async findElementsByXpath(v, target){
        return this.findElementsBy('xpath', v, target)
    }
}

module.exports = Driver

export {
    Driver
}