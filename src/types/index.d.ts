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

interface Module {
    name: string;
    version: string;
    active: boolean;
    default: boolean;
}

interface TaskModule extends Module {

}

interface DriverModule extends Module {
    
}

interface StorageModule extends Module {
   
}

interface NotificationModule extends Module {
    
}