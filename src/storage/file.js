const path = require('path')
const Utils = require('uni-utils')

class File {
    #conf = null
    #taskConf = null
    constructor(dbConf,taskConf) {
        this.#conf = dbConf
        this.#taskConf = taskConf
    }
    #getDetailPath(id){
        const filename = `${id}.json`
        return path.join(this.#taskConf.main.dataPath,'detail', filename)
    }
    #getPath(name){
        const pathList = {
            saveDetailDataDir: path.join(this.#taskConf.main.dataPath,'detail')
        }
        return pathList[name]
    }
    async init(){

    }
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

    async query(collection,where){
        if(!this.client.isConnected) await this.init()
        return this._db.collection(collection).find(where).toArray()
    }
    async close(){
    }
}
module.exports = File
