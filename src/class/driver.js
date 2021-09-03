const Base = require("./base");

class Driver extends Base{
    #conf = null
    #driver = null
    constructor(conf){
        super()
        this.#conf = conf
    }
    setDriver(v){
        this.#driver = v
    }
    async init(){}
    async clear(){}
    async open(){}
    async closeTab(){}
    async quit(){}

    get conf(){
        return this.#conf
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
        throw new Error('must implement buildSelector()')
    }

    async findElements(){
        throw new Error('must implement findElements()')
    }
    async findElement(){
        throw new Error('must implement findElement()')
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
