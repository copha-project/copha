const child_process = require('child_process')

function closeProcess(name){
    const cmd = `ps aux | grep "${name}" | awk -F ' ' '{print $2}' | xargs kill`
    try {
        child_process.execSync(cmd,{stdio:"ignore"})
    } catch (error) {
        //pass
    }
}
function main(){
    closeProcess('firefox-bin')
    closeProcess('geckodriver')
    closeProcess('Google Chrome')
    // const res = child_process.execSync('ls -la', { encoding: 'utf-8'})
    console.log('ok')
}

main()
