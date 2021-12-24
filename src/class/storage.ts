import Module from './module'
export default abstract class Storage extends Module {

    protected readonly typeName = 'Storage'
    get storageType(){
        return this.projectConfig?.Storage?.Name
    }
    
    abstract findById(id: string|number): unknown

    abstract all(): unknown[]

    abstract save(data: object, id: string|number): unknown
}