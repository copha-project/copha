import Module from './module'
export default abstract class Notification extends Module{
    protected readonly typeName = 'Notification'
    abstract send(msg:string): void
}