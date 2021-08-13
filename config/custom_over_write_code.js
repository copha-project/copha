/**
 * can overwrite method:
 * {runBefore}
 * {getListData}
 * {getItemData}
 * {getItemId}
 */

module.exports = {
    async runBefore() {
        console.log('ok');
    },
    async getItemId(){
        console.log("ok")
    }
}
