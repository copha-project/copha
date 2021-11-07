const Router = require('koa-router')
const Service = require('./service')

const router = new Router()
const apiRouter = new Router({prefix: '/api'})
const service = new Service()

apiRouter
.get('/',service.home)
.get('/project', service.project)
.get('/task', service.task)
.get('/settings', service.settings)
.get('/project/:name/config',service.projectConf)

router.get('/',service.home)
router.all('(.*)',service.notFind)

module.exports = {
    CommonRouter: router,
    ApiRouter: apiRouter
}
