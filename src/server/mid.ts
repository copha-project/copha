import Controller from './controller'

export async function reqLog(ctx, next){
    const service = Controller.getInstance()
    const start = Date.now()
    await next()
    const ms = Date.now() - start
    service.log.info(`${ctx.method} ${ctx.url} ${ctx.status} - ${ms} ms`)
}

export async function errHandler(ctx, next){
    try {
        await next()
    } catch (e) {
        ctx.status = 500
        ctx.body = "500 service not work"
    }
}
