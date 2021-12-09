import Koa from 'koa'
import Compose from 'koa-compose'
import Base from './base'
import Core from './core'
import { CommonRouter, ApiRouter } from '../server/router'
import { errHandler, reqLog } from '../server/mid'

export default class Server extends Base {
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
        options.port = options.port || this.appSettings.Server?.Port || 7000
        options.host = options.host || this.appSettings.Server?.Host || '127.0.0.1'
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
        this.app.listen(this.serverConfig.port)
    }
}