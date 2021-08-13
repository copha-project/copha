class File {
    constructor(conf) {
        this.conf = conf
    }
    async init(taskConf){

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
    }
}
module.exports = File
