const Base = require('../class/base')

class DB extends Base {
    #db = null
    constructor(taskConf) {
        super(taskConf)
        this.storageType = taskConf?.Storage?.Type || 'file'
        const Adapter = require(`./${this.storageType}`)
        const adapterConfig = this.appSettings.Storage.AdapterList[this.storageType]
        this.#db = new Adapter(adapterConfig,taskConf)
    }
    init(){
        // this.isInit = true
        // this.#db.init(this.taskConf).then(()=>{
        //     this.isInit = true
        // })
    }
    async findById(id){
        return this.#db.findById(id)
    }
    async all(){
        return this.#db.all()
    }
    async save(data){
        return this.#db.save(data)
    }

    async query(table,p){
        return this.#db.query(table,p)
    }
    async querySync(table,p){
        return this.query(table,p)
    }
    async close(){
        return this.#db.close()
    }
}
module.exports = DB
