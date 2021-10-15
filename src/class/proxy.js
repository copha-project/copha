const path = require('path')
const Base = require('./base')

class Proxy extends Base {
    static #instance = null
    constructor() {
        super()
    }
    static getInstance(){
        if(!this.#instance){
			this.log.debug('new proxy instance')
            this.#instance = new this
        }else{
			this.log.debug('reuse config')
		}
        return this.#instance
    }

    getProxy(index){
        if(this.appSettings.Proxy?.List?.length < index){
            throw new Error('not find delare proxy info')
        }
        return this.appSettings.Proxy.List[index]
    }
}

module.exports = Proxy
