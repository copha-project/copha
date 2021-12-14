interface BaseObject {
    [key: string]: any;
}

interface AppSettings extends BaseObject {
    DataPath:string
    Language:string
    Editor:string
}

interface ProjectConfig extends BaseObject {
    
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

interface TaskModule extends Module {

}

interface DriverModule extends Module {
    
}

interface StorageModule extends Module {
   
}

interface NotificationModule extends Module {
    
}