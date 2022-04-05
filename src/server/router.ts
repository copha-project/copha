import Router from 'koa-router'
import Controller from './controller'

export function CommonRouter(){
    const router = new Router()
    const service = Controller.getInstance<Controller>()
    
    router.get('/',service.home)
    router.all('(.*)',service.notFind)
    
    return router.routes()
}

export function ApiRouter(){
    const apiRouter = new Router({prefix: '/api'})
    const service = Controller.getInstance<Controller>()

    apiRouter
    .get('/',service.home)
    .get('/project', service.project)
    .get('/task', service.task)
    .get('/settings', service.settings)
    .get('/project/:name/config',service.projectConf)

    return apiRouter.routes()
}