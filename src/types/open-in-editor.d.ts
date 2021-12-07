export = a
// declare module a {
//     function configure(options:any, errHandle?:(err:any)=>void): {open:(file:string)=>Promise<void>}
// }
declare namespace a {
    function configure(options:any, errHandle?:(err:any)=>void): {open:(file:string)=>Promise<void>}
}

// declare module "pidusage" {
//     function pidusage(params:number): Promise<any>;
//     export = pidusage
// }