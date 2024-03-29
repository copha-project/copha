import Base from './base'

export default class Proxy extends Base {
    private static instance: Proxy
    constructor() {
        super()
    }
    static getInstance(){
        if(!this.instance){
			this.log.debug('new proxy instance')
            this.instance = new this
        }else{
			this.log.warn('reuse proxy config')
		}
        return this.instance
    }

    getProxy(index: number){
        if(this.appSettings.Proxy?.List?.length < index){
            throw new Error(this.getMsg(41))
        }
        return this.appSettings.Proxy.List[index]
    }
}