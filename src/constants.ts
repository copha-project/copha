const path = require('path')
const pkg = require('../package')
import Common from './common'

// store dir on install
const AppConfigUserDir = path.resolve(Common.homedir(),'.copha')
// store tasks at local settings
const AppUserTasksDir = path.resolve(AppConfigUserDir,'./tasks')
// store drivers at local settings
const AppUserDriversDir = path.resolve(AppConfigUserDir,'./drivers')
// app config file path on user disk
const AppConfigUserPath = path.join(AppConfigUserDir,'config.json')

const AppInstalledLockFile = path.join(AppConfigUserDir,'install.lock')

const AppUserTasksDataPath = path.resolve(AppConfigUserDir,'task.data')

const AppUserDriversDataPath = path.resolve(AppConfigUserDir,'driver.data')
// app rootPath
const AppProjectRootPath = path.resolve(__dirname, '../')

const AppConfigTplPath = path.resolve(AppProjectRootPath, `${Common.isDev ? 'src' : 'dist'}/resource/config`)

const AppDefaultConfigDir = path.resolve(AppConfigTplPath, './default')

const AppExecutableCommandPath = path.join(AppProjectRootPath, './bin/index.js')

const AppConfigTpl = {
    configPath: path.join(AppConfigTplPath, 'project.conf.tpl.json'),
    statePath: path.join(AppConfigTplPath, 'state.json'),
    custom_exec_code: path.join(AppConfigTplPath, 'custom_exec_code.js'),
    custom_export_data: path.join(AppConfigTplPath, 'custom_export_data.js'),
    custom_over_write_code: path.join(AppConfigTplPath, 'custom_over_write_code.js')
}

const LangList = ["en","cn"]

const DocsLinks = {
    StorageHelpLink: pkg.homepage + "/storage",
    ProjectHelpLink: pkg.homepage + "/project",
    TaskHelpLink: pkg.homepage + "/task",
    DriverHelpLink: pkg.homepage + "/driver"
}

const AppProjectPathSet =  {
    root_dir: '',
    config_dir: 'config',
    data_dir: 'data',
    download_dir: 'data/download',
    page_dir: 'data/page',
    detail_dir: 'data/detail',
    export_dir: 'data/export',
    log_dir: 'log',
    config: 'config/config.json',
    custom_exec_code:'custom_exec_code.js',
    custom_over_write_code:'custom_over_write_code.js',
    custom_export_data:'custom_export_data.js',
    state: 'state.json',
    info_log: 'log/info.log',
    err_log: 'log/err.log',
    pid: 'project.pid',
    task_file: 'task'
}

const DefaultEditorList = ['code','vim','vi','nano']

const BugLink = pkg?.bugs?.url

export default {
    AppProjectRootPath,
    AppConfigUserDir,
    AppConfigUserPath,
    AppConfigTplPath,
    AppDefaultConfigDir,
    AppExecutableCommandPath,
    AppConfigTpl,
    AppProjectPathSet,
    BugLink,
    AppInstalledLockFile,
    AppUserTasksDir,
    AppUserDriversDir,
    AppUserTasksDataPath,
    AppUserDriversDataPath,
    LangList,
    DefaultEditorList,
    DocsLinks
}