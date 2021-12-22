import path from 'path'
import Module from './module'
import Project from './project'
import Utils from 'uni-utils'

export default abstract class Task extends Module {
    private _storage = null
    private _driver = null
    private _notification = null
    private _custom = null

    setStorage (storage) {
      this.setModule(storage, ModuleType.Storage)
    }

    setDriver (driver) {
      this.setModule(driver, ModuleType.Driver)
    }

    setNotification (notifier) {
      this.setModule(notifier, ModuleType.Notification)
    }

    private setModule (module, moduleType: ModuleType) {
      this[`_${moduleType}`] = module
    }

    setCustom (custom) {
      this._custom = custom
    }

    abstract runTest (): unknown
    abstract loadState (): unknown
    abstract runBefore (): unknown
    abstract run (): unknown
    abstract saveContext (): unknown
    abstract recover (): unknown
    abstract reset (): unknown
    abstract clear (): unknown 

    getPath (name: string) {
      return Project.getPath(this.projectName, name)
    }

    getResourcePath (name: string, type = 'json') {
      return path.join(this.getPath('task_file'), `${name}.${type}`)
    }

    get helper () {
      return {
        uni: Utils
      }
    }

    get custom () {
      return this._custom
    }

    get driver () {
      return this._driver
    }

    get notification () {
      return this._notification
    }

    get storage () {
      return this._storage
    }

    get name () {
      return this.projectConfig.main.task
    }
}
