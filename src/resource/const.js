const path = require('path')
const os = require('os')

const AppConfigDir = path.resolve(os.homedir(),'.copha')
const AppConfigPath = path.join(AppConfigDir,'config.json')



module.exports = {
    AppConfigDir,
    AppConfigPath
}
