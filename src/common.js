const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV && process.env.NODE_ENV === "development" || process.env.COPHA_DEBUG

function homedir () {
  const env = process.env
  const home = env.HOME
  const user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME

  if (process.platform === 'win32') {
    return env.USERPROFILE || env.HOMEDRIVE + env.HOMEPATH || home || null
  }

  if (process.platform === 'darwin') {
    return home || (user ? '/Users/' + user : null)
  }

  if (process.platform === 'linux') {
    return home || (process.getuid() === 0 ? '/root' : (user ? '/home/' + user : null))
  }

  return home || null
}

async function zipDir(dirPath,outPath){
  const dirStat = await fs.promises.stat(dirPath)
  
  if(!path.isAbsolute(outPath)){
    throw Error(`outPath [ ${outPath} ] not exist.`)
  }

  if(!dirStat.isDirectory()){
    throw Error('input path not is a dir')
  }

  return zip(dirPath,outPath)
}

function zip (inPath,outPath) {
  return new Promise((resolve,reject)=>{
    const archiver = require('archiver')

    const output = fs.createWriteStream(outPath)

    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    })
  
    archive.on('error', function(err) {
      reject(err)
    })
  
    archive.pipe(output)
  
    output.on('close', function() {
      resolve(archive.pointer())
    })
  
    // append files from a sub-directory and naming it `new-subdir` within the archive
    archive.directory(inPath, false)
  
    archive.finalize()
  })

  // archive.append(fs.createReadStream(file1), { name: 'file1.txt' })

  // append a file from string
  // archive.append('string cheese!', { name: 'file2.txt' });

  // append a file from buffer
  // const buffer3 = Buffer.from('buff it!');
  // archive.append(buffer3, { name: 'file3.txt' });

  // append a file
  // archive.file('file1.txt', { name: 'file4.txt' });

  // append files from a sub-directory and naming it `new-subdir` within the archive
  // archive.directory('subdir/', 'new-subdir');

  // append files from a sub-directory, putting its contents at the root of archive
  // archive.directory('subdir/', false);

  // append files from a glob pattern
  // archive.glob('file*.txt', {cwd:__dirname});
}

module.exports = {
  isDev,
  homedir,
  zipDir
}