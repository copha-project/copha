const Config = require('../../config');
class DB {
    constructor(taskConf) {
        const db = require(`./${taskConf.Type}`)
        this.db = new db(Config.Storage.AdapterList[taskConf.Type])
        this.taskConf = taskConf
        this.isInit = false
        this.type = taskConf.Type
    }
    init(){
        this.db.init(this.taskConf).then(()=>{
            this.isInit = true
        })
    }
    async query(table,p){
        if(!this.isInit) await this.init()
        return this.db.query(table,p)
    }
    async queryAsync(table,p){
        return this.query(table,p)
    }
    async findById(table,id){
        if(!this.isInit) await this.init()
        return this.db.findById(table,id)
    }
    async save(table,data){
        if(!this.isInit) await this.init()
        return this.db.save(table,data)
    }
    async close(){
        return this.db.close()
    }
}
module.exports = DB
