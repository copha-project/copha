const Base = require("./base");

class Driver extends Base{
    #conf = null
    constructor(conf){
        this.#conf = conf
    }
    async init(){}
    async clear(){}
    async open(){}
    async closeTab(){}
    async quit(){}

}

module.exports = Driver