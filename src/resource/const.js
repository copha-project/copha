const path = require('path')
const os = require('os')
const pkg = require('../../package')

// store dir on install
const AppConfigUserDir = path.resolve(os.homedir(),'.copha')
// store jobs at local settings
const AppUserJobsDir = path.resolve(AppConfigUserDir,'./jobs')
// app config file path on user disk
const AppConfigUserPath = path.join(AppConfigUserDir,'config.json')

const AppInstalledLockFile = path.join(AppConfigUserDir,'install.lock')

// code rootPath
const AppProjectRootPath = path.resolve(__dirname, '../../')

const AppTplConfigPath = path.resolve(AppProjectRootPath, 'src/config')

const AppDefaultConfigDir = path.resolve(AppTplConfigPath, './default')

const AppExecutableCommandPath = path.join(AppProjectRootPath, './bin/index.js')

const AppConfigTpl = {
    configPath: path.join(AppTplConfigPath, 'task.conf.tpl.json'),
    statePath: path.join(AppTplConfigPath, 'state.json'),
    custom_exec_code: path.join(AppTplConfigPath, 'custom_exec_code.js'),
    custom_export_data: path.join(AppTplConfigPath, 'custom_export_data.js'),
    custom_over_write_code: path.join(AppTplConfigPath, 'custom_over_write_code.js')
}

const AppTaskPathSet =  {
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
    pid: 'task.pid',
    job_file: 'job/resource'
}

const BugLink = pkg?.bugs?.url

const AppTaskTypeMap = {
    default: 'empty',
    list: 'list_fetch'
}

module.exports = {
    AppProjectRootPath,
    AppConfigUserDir,
    AppConfigUserPath,
    AppTplConfigPath,
    AppDefaultConfigDir,
    AppExecutableCommandPath,
    AppConfigTpl,
    AppTaskPathSet,
    BugLink,
    AppInstalledLockFile,
    AppTaskTypeMap,
    AppUserJobsDir
}
