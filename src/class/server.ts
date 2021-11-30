const Koa = require('koa')
const Compose = require('koa-compose')
import Base from './base'
const Core = require('./core')
const {CommonRouter, ApiRouter} = require('../server/router')
const {errHandler, reqLog } = require('../server/mid')

interface ServerConfig {
    host: string,
    port: number
}

class Server extends Base {
    private static instance: Server
    private _serverConfig: ServerConfig
    private app: any
    constructor() { super() }

    static getInstance(options: ServerConfig): Server{
        if(!this.instance){
            this.instance = new Server()
            this.instance.setConfig(options)
            this.instance.init()
        }
        return this.instance
    }

    private setConfig(options: ServerConfig){
        this._serverConfig = options
    }

    get serverConfig(){
        return this._serverConfig
    }

    init(){
        this.log.debug('init Server')
        this.app = new Koa()
        this.app
        .use(Compose([errHandler,reqLog]))
        .use(ApiRouter.routes())
        .use(CommonRouter.routes())

        this.app.context.copha = Core.getInstance()
        return this
    }
    launch() {
        const port = this.serverConfig.port || this.appSettings.Server?.Port || 7000
        this.app.listen(port)
    }
}

module.exports = Server

export {
    Server
}