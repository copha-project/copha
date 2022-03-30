interface BaseObject {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

interface AppSettings {
    DataPath:string
    Language:string
    Editor:string
    ModuleHub: string
    Server: {
        Host: string,
        Port: number
    }
}

interface ProjectConfig {
    Name: string
    Desc: string
    CreateTime: string
    Task: string
    AlwaysRestart: boolean
}

interface ServerConfig {
    host: string,
    port: number
}

declare const enum ModuleType {
    Task="task"
}
interface Module {
    name: string
    desc: string
    type: string
    repository: string | undefined
    version: string
    active: boolean
    default: boolean
}

interface RemoteModule {
    name: string
    desc: string
    type: string
    repository: string
    down_link: string
}

declare type TaskModule = Module