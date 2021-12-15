import Module from './module'
export default class Storage extends Module {
    constructor() { super() }
    
    get storageType(){
        return this.projectConfig?.Storage?.Name
    }
    
    async findById(){
        throw new Error(this.getMsg(10,'findById(id)'))
    }

    async all(){}

    async save(){
        throw new Error(this.getMsg(10,'save(data,id)'))
    }

    async query(){}

    querySync(){}

    async close(){}
}