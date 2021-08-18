async function exportData() {
	this.log.info('exportData code ok, some helper can use :')
    console.log(Object.keys(this.helper))
}
module.exports = exportData
