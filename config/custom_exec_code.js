async function runCode() {
	this.log.info('custom code ok, some helper can use :')
    console.log(Object.keys(this.helper))
}
module.exports = runCode
