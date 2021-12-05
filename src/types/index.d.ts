interface BaseObject {
    [key: string]: any;
}

interface AppSettings extends BaseObject {
    
}

interface ProjectConfig extends BaseObject {
    
}

interface TaskModel {
    name: string;
    version: string;
}