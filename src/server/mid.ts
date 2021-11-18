const Service = require('./service')
const service = new Service()

exports.reqLog = async (ctx, next) => {
    const start = Date.now()
    await next()
    const ms = Date.now() - start
    service.log.info(`${ctx.method} ${ctx.url} ${ctx.status} - ${ms} ms`)
}

exports.errHandler = async (ctx, next) => {
    try {
        await next()
    } catch (e) {
        ctx.status = 500
        ctx.body = "500 service not work"
    }
}
