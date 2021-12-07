// export = a.p
// declare module a {
//     function p(params:number): Promise<any>;
// }
declare function p(params:number): Promise<any>;
export = p