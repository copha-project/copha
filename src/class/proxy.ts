const path = require('path')
const Base = require('./base')

class Proxy extends Base {
    private static instance = null
    constructor() {
        super()
    }
    static getInstance(){
        if(!this.instance){
			this.log.debug('new proxy instance')
            this.instance = new this
        }else{
			this.log.warn('reuse config')
		}
        return this.instance
    }

    getProxy(index: number){
        if(this.appSettings.Proxy?.List?.length < index){
            throw new Error('not find delare proxy info')
        }
        return this.appSettings.Proxy.List[index]
    }
}

module.exports = Proxy

export {}