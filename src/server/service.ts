import Base from '../class/base'

class Service extends Base {
    static instance: Service
    constructor() {
        super()
    }

    static getInstance(){
        if(!this.instance){
            this.log.debug('init Service')
            this.instance = new this()
        }
        return this.instance
    }

    async home(ctx){
        ctx.body = "ok"
    }
    settings(ctx){
        ctx.body = ctx.copha.appSettings
    }
    async project(ctx){
        ctx.body = await ctx.copha.listProject()
    }
    async task(ctx){
        ctx.body = await ctx.copha.listTask()
    }
    async projectConf(ctx){
        ctx.body = await ctx.copha.getProjectConf(ctx.params.name)
    }
    async notFind(ctx){
        ctx.status = 404
        ctx.body = "not found"
        return ctx
    }
}

module.exports = Service

export {}