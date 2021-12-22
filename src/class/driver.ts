import Module from './module'
import Utils from 'uni-utils'
import Core from './core'
export default abstract class Driver extends Module {
    DriverModule = this

    private _driver = this

    async getProxy(){
        return Core.getInstance().getProxy(this.projectConfig?.Proxy?.SelectIndex || 0)
    }

    async sleep(n:number){
        return Utils.sleep(n)
    }

    get driver(){
        return this._driver
    }

    set driver(v){
        this._driver = v
    }

    abstract open(): unknown
    abstract clear(): unknown
    abstract closeTab(): unknown
    abstract quit(): unknown
    abstract getKey(): unknown
    abstract getTitle(): unknown
    abstract getCurrentUrl(): unknown
    abstract findElements(): unknown
    abstract findElement(): unknown
}
