/**
 * check global config file and create it if it not exits
 */
const path = require('path')
const os = require('os')
const Utils = require('uni-utils')

const AppConfigDir = path.resolve(os.homedir(),'.copha')
const AppConfigPath = path.join(AppConfigDir,'config.json')
const AppDefaultConfigPath = path.resolve('./config/default.json')
const InstallLockFile = path.join(AppConfigDir,'install.lock')

const main = async () => {
    if(await Utils.checkFile(AppConfigDir)) return
    console.log('init app config dir')
    await Utils.createDir(AppConfigDir)
    try {
        await Utils.copyFile(AppDefaultConfigPath,AppConfigPath)
        await Utils.saveFile("",InstallLockFile)
    } catch (e) {
        await Utils.rm(AppConfigDir)
    }
}

;(async ()=>{
    try {
        await main()
    } catch (e) {

    }
})()
