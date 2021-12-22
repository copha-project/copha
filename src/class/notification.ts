import Module from './module'
export default abstract class Notification extends Module{
    abstract send(msg:string): void
}