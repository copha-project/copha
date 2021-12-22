interface BaseObject {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

interface AppSettings {
    DataPath:string
    Language:string
    Editor:string
    Modules: {
        Driver: {
            Default: string
        },
        Task: {
            Default: string
        },
        Storage: {
            Default: string
        },
        Notification: {
            Default: string
        }
    },
    Proxy: {
        List: []
    },
    Server: {
        Host: string,
        Port: number
    }
}

interface ProjectConfig {
    main: {
        name: string
        desc: string
        createTime: string
        task: string
        alwaysRestart: boolean
    }
    Driver: BaseObject
    Proxy: BaseObject
    Storage: BaseObject
    Task: BaseObject
}

interface ServerConfig {
    host: string,
    port: number
}

declare const enum ModuleType {
    Task="task",
    Driver="driver",
    Storage="storage",
    Notification="notification"
}

declare const enum ModuleLevel {
    I="I",
    II="II",
    III="III"
}
interface Module {
    name: string;
    desc: string;
    type: ModuleType;
    repository?: string;
    version: string;
    active: boolean;
    level: ModuleLevel;
}

declare type TaskModule = Module