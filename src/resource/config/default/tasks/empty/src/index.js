const { Task } = require('copha')

class EmptyTask extends Task {
    constructor() {
        super()
    }

    async runTest() {
    }

    async run(){
        this.log.info(`start run task:`)
        await this.driver.open('https://copha.net')
        this.log.info(`open web title is : ${await this.driver.getTitle()}`)
        this.log.info(`task end.`)
    }

    async runBefore(){
        this.log.info('Called before the task runs')
    }
}

module.exports = EmptyTask
