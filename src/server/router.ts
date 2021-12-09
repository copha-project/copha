import Router from 'koa-router'
import Service from './service'

export const CommonRouter = new Router()
export const ApiRouter = new Router({prefix: '/api'})
const service = new Service()

ApiRouter
.get('/',service.home)
.get('/project', service.project)
.get('/task', service.task)
.get('/settings', service.settings)
.get('/project/:name/config',service.projectConf)

CommonRouter.get('/',service.home)
CommonRouter.all('(.*)',service.notFind)