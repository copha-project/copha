const path = require('path')
const os = require('os')

const AppConfigDir = path.resolve(os.homedir(),'.copha')
const AppConfigPath = path.join(AppConfigDir,'config.json')
const AppTplConfigPath = path.resolve(__dirname,'../../config')
const AppExecutableCommandPath = path.join(__dirname, '../../bin/index.js')
const AppConfigTpl = {
    configPath: path.join(AppTplConfigPath, 'task.conf.tpl.json'),
    statePath: path.join(AppTplConfigPath, 'task_state.json'),
    custom_exec_code: path.join(AppTplConfigPath, 'custom_exec_code.js'),
    custom_export_data: path.join(AppTplConfigPath, 'custom_export_data.js'),
    custom_over_write_code: path.join(AppTplConfigPath, 'custom_over_write_code.js'),
    last_page: path.join(AppTplConfigPath, 'last_page.txt'),
    rework_pages: path.join(AppTplConfigPath, 'rework_pages.json'),
}

module.exports = {
    AppConfigDir,
    AppConfigPath,
    AppExecutableCommandPath,
    AppConfigTpl
}
