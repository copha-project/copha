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

interface TaskModel {
    name: string;
    version: string;
}