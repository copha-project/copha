import { spawn } from 'child_process'
import * as winston from 'winston'
import Common from '../common'
import { format, createLogger } from 'winston'

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


export default class Logger {
    logger: any
    constructor(logConf?){
        winston.addColors(LogBaseConfig.colors)
        this.logger = createLogger({
            level: Common.isDebug ? 'custom' : 'info',
            levels: LogBaseConfig.levels,
            format: winston.format.json(),
            transports: []
        })
        if(logConf?.infoPath){
            this.logger.add(new winston.transports.File({
                filename: logConf.infoPath,
                level: 'info',
                format: format.combine(
                    LogTimeConfig,
                    LogTextFormatConfig
                )
            }))
        }
        if(logConf?.errPath){
            this.logger.add(new winston.transports.File({
                filename: logConf.errPath,
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
    static async stream(logPath){
        const tailProc = spawn('tail', ['-f',logPath])
        tailProc.stdout.on('data', (data) => {
            console.log(`${data}`)
        })

        tailProc.stderr.on('data', (data) => {
            throw Error(`${data}`)
        })
    }
    async stream(logPath){
        return Logger.stream(logPath)
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