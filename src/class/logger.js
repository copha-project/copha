const winston = require('winston')
const { isDev } = require('../common.js')
const { format, createLogger } = require('winston')

const LogBaseConfig = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        data: 3,
        debug: 4,
        verbose: 5,
        silly: 6,
        custom: 7
    },
    colors: {
        error: 'red',
        debug: 'blue',
        warn: 'yellow',
        data: 'grey',
        info: 'green',
        verbose: 'cyan',
        silly: 'magenta',
        custom: 'yellow'
    }
}
const LogTextFormatConfig = format.printf(({ level, message, timestamp }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
const LogTimeConfig = format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'})
const LogColorConfig = format.colorize({ all: true })


class Logger {
    constructor({infoPath,errPath}={}){
        winston.addColors(LogBaseConfig.colors)
        this.logger = createLogger({
            level: isDev ? 'custom' : 'info',
            levels: LogBaseConfig.levels,
            format: winston.format.json(),
            transports: []
        })
        if(infoPath){
            this.logger.add(new winston.transports.File({
                filename: infoPath,
                level: 'info',
                format: format.combine(
                    LogTimeConfig,
                    LogTextFormatConfig
                )
            }))
        }
        if(errPath){
            this.logger.add(new winston.transports.File({
                filename: errPath,
                level: 'error',
                format: format.combine(
                    LogTimeConfig,
                    LogTextFormatConfig
                )
            }))
        }
        this.logger.add(new winston.transports.Console({
            format: format.combine(
                LogTimeConfig,
                LogTextFormatConfig,
                LogColorConfig,
            )
        }))
    }
    debug(...e){
        this.logger.debug(e)
    }
    err(...e){
        this.logger.error(e)
    }
    info(...e){
        this.logger.info(e)
    }
    warn(...e){
        this.logger.warn(e)
    }
}

module.exports = Logger
