const mongo = require('mongodb')

class Mongo {
    constructor(conf) {
        const authMechanism = 'DEFAULT' // ?authMechanism=${authMechanism}
        const auth = conf.user?`${conf.user}:${encodeURIComponent(conf.pass)}@`:''
        const url = `mongodb://${auth}${conf.host}:${conf.port}/?`
        this.client = new mongo.MongoClient(url)
    }
    async init(taskConf){
        await this.client.connect()
        this._db = this.client.db(taskConf.Database)
    }
    async query(collection,where){
        if(!this.client.isConnected) await this.init()
        return this._db.collection(collection).find(where).toArray()
    }
    async findById(collection,id){
        if(!this.client.isConnected) await this.init()
        return this._db.collection(collection).findOne({_id:mongo.ObjectId(id)})
    }
    async save(collection,data){
        if(!this.client.isConnected) await this.init()

        return this._db.collection(collection).insertOne(data)
    }
    async close(){
        setTimeout(()=>{
            this.client.close()
        },100)
    }
}
module.exports = Mongo
