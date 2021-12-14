import Base from './base'

export default class Module extends Base {
    static instance: Module
    constructor() {
        super()
    }

    static getInstance(){
        if(!this.instance){
            this.instance = new this()
        }
        return this.instance
    }
}