export = uniUtils

declare namespace uniUtils {
    function checkFile(file:string): Promise<boolean>
    function exportFile(data:string, path:string, format:string): Promise<void>
    function getTodayDate(): string
    function sleep(microSeconds:number): Promise<void>
    function rm(file:string): Promise<void>
    function saveFile(data:string, path:string): Promise<void>
    function readDir(dir:string): Promise<string[]>
    function readJson(file:string): Promise<any>
    function download(url:string, options:any): Promise<any>
    function loopTask(tasks: string[], taskHandel:(data:any)=>Promise<any>, options:any): Promise<any>
    function copyDir(srcDir:string,distDir:string): Promise<any>
    function checkFileSync(file:string): boolean
    function readJsonSync(file:string): any
    function fileExist(file:string): Promise<boolean>
    function readFile(file:string): Promise<string>
    function createProcess(jsPath:string, options: string[]): Promise<any>
    function createDir(dirPath:string|string[]): Promise<any>
    function copyFile(srcFile:string,distFile:string): Promise<any> 
}