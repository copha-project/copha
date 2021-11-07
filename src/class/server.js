const Koa = require('koa')
const Compose = require('koa-compose')
const Base = require('./base')
const Core = require('./core')
const {CommonRouter, ApiRouter} = require('../server/router')
const {errHandler, reqLog } = require('../server/mid')

class Server extends Base {
    constructor() {
        super()
        this.init()
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
        const port = this.appSettings.Server?.Port || 7000
        this.app.listen(port)
    }
}

module.exports = Server
