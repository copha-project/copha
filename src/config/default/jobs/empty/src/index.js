const {Job, Utils} = require('copha')

class EmptyJob extends Job {
    constructor(taskConf) {
        super(taskConf)
    }

    async runTest() {
        this.log.info(`run test:`)
        await this.driver.open('https://baidu.com')
        this.log.info(`open web title is : ${await this.driver_.getTitle()}`)
        await Utils.countdown(5)
        this.log.info(`test end.`)
    }

    async run(){
        this.log.info('run job')
    }

    async runBefore(){
        this.log.info('runBefore in job')
    }
}

module.exports = EmptyJob
