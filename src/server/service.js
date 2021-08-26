const Base = require('../class/base')

class Service extends Base {
    static instance = undefined
    constructor() {
        if(!Service.instance){
            super()
            Service.instance = this.getInstance()
        }
        return Service.instance
    }
    getInstance(){
        this.log.debug('init Service')
        return this
    }
    async home(ctx){
        ctx.body = "ok"
    }
    settings(ctx){
        ctx.body = ctx.copha.appSettings
    }
    async task(ctx){
        ctx.body = await ctx.copha.listTask()
    }

    async task_conf(ctx){
        ctx.body = await ctx.copha.getTaskConf(ctx.params.name)
    }
    async notFind(ctx){
        ctx.status = 404
        ctx.body = "not found"
        return ctx
    }
}

module.exports = Service
