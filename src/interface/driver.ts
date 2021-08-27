export interface Driver {
    driver: any
    init():void
    open(url: String):void

}
