const path = require('path')
const { Storage, Project } = require('copha')
const Utils = require('uni-utils')

class File extends Storage {
    static CONFIG = require('./config.json')
    constructor() {
        super()
    }

    #getDetailPath(id){
        const filename = `${id}.json`
        const detailPath = this.projectConfig.main.dataPath ? path.join(this.projectConfig.main.dataPath,'detail') : Project.getPath(this.projectConfig.main.name,'detail_dir')
        return path.join(detailPath, filename)
    }

    #getPath(name){
        const pathList = {
            saveDetailDataDir: this.projectConfig.main.dataPath ? path.join(this.projectConfig.main.dataPath,'detail') : Project.getPath(this.projectConfig.main.name,'detail_dir')
        }
        return pathList[name]
    }

    async init(){}

    async findById(id){
        const isExist = await Utils.checkFile(this.#getDetailPath(id))
        return isExist ? Utils.readJson(this.#getDetailPath(id)) : null
    }

    async all(){
        return (await Utils.readDir(this.#getPath('saveDetailDataDir')))
            .filter(f => f.endsWith('.json'))
            .map(f => path.join(this.#getPath('saveDetailDataDir'), f))
    }

    async save({data,id}){
        await Utils.saveJson(data, this.#getDetailPath(id))
    }

    async close(){}
}
module.exports = File
