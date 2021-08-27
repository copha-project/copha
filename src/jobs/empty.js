// eslint-disable-next-line no-unused-vars
const path = require('path')
const Utils = require('uni-utils')
// eslint-disable-next-line no-unused-vars
const Job = require('../class/Job')

class EmptyJob extends Job {
    constructor(taskConf) {
        super(taskConf)
    }

    async runTest() {
        this.log.info(`run test:`)
        this.log.info(`test end.`)
    }

    async run(){
        await this.driver.open('https://baidu.com')
        console.log('sleep 100\'s to exit');
        await Utils.sleep(100000)
    }

    async runBefore(){
        this.log.info('runBefore in job')
    }
}

module.exports = EmptyJob
