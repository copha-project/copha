const { Driver } = require('copha')
const https = require('https')

class SimpleDriver extends Driver {
    _resp = ''
    constructor() {
        super()
    }
    async init() {

    }

    async open(url) {
        return new Promise((resolve,reject)=>{
            https.get(url, (res) => {
                res.on('data', (chunk) => {
                    this._resp += chunk
                })
                res.on('end', () => {
                    resolve()
                })
              })
        })
    }

    async clear() {

    }

    async sleep(n) {

    }

    buildSelector(k,v){

    }
    getKey(name){

    }
    getTitle(){
        return new RegExp(/<title>(.*)<\/title>/).exec(this.resp)[1]
    }
    async findElements(v){

    }
    async findElement(v){

    }
    get resp(){
        return this._resp
    }
}

module.exports = SimpleDriver
