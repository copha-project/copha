const path = require('path')
const RootPath = path.resolve(__dirname,'../')
const config = require(path.resolve(RootPath, 'config/default.json'))
if (config?.DataPath === "" && process.env['COPHA_DATA_PATH']){
    config.DataPath = process.env['COPHA_DATA_PATH']
}
module.exports = config
