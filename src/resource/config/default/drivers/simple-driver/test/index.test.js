const SimpleDriver = require('../index')

const simpleDriver = new SimpleDriver({})

simpleDriver.open('https://www.baidu.com').then(res=>{
    console.log(simpleDriver.getTitle())
})
