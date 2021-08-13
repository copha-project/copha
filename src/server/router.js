const Router = require('koa-router')
const Service = require('./service')

const router = new Router()
const apiRouter = new Router({prefix: '/api'})
const service = new Service()

apiRouter
.get('/',service.home)
.get('/task', service.task)

router.get('/',service.home)
router.all('(.*)',service.notFind)

module.exports = {
    CommonRouter: router,
    ApiRouter: apiRouter
}
