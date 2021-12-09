import path from 'path'
import fs from 'fs'

export default class Common {
  static isDebug = typeof process.env.COPHA_DEBUG !== "undefined"
  static isDev = process.env.NODE_ENV !== "production"

  static homedir() {
    const env = process.env
    let home: string|undefined|null = env.HOME
    const user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME

    if (process.platform === 'win32') {
      home = home || env.USERPROFILE || (env.HOMEDRIVE || '') + (env.HOMEPATH || '')
    }

    if (process.platform === 'darwin') {
      home = home || (user ? '/Users/' + user : null)
    }

    if (process.platform === 'linux') {
      home = home || (process.getuid() === 0 ? '/root' : (user ? '/home/' + user : null))
    }
    
    if(!home) throw new Error(`can't get use home path!`)
    
    return home
  }

  static async zipDir(dirPath, outPath) {
    const dirStat = await fs.promises.stat(dirPath)

    if (!path.isAbsolute(outPath)) {
      throw Error(`outPath [ ${outPath} ] not exist.`)
    }

    if (!dirStat.isDirectory()) {
      throw Error('input path not is a dir')
    }

    return this.zip(dirPath, outPath)
  }

  static zip(inPath, outPath) {
    return new Promise((resolve, reject) => {
      const archiver = require('archiver')

      const output = fs.createWriteStream(outPath)

      const archive = archiver('zip', {
        zlib: {
          level: 9
        } // Sets the compression level.
      })

      archive.on('error', function (err) {
        reject(err)
      })

      archive.pipe(output)

      output.on('close', function () {
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

  static cp(source, destination) {
    const ncp = require('ncp').ncp
    ncp.limit = 10
    return new Promise((resolve, reject) => {
      ncp(source, destination, function (err) {
        if (err) {
          return reject(err)
        }
        resolve(null)
      })
    })
  }

  static domain(func, errHandle, cb) {
    const d = require('domain').create()

    d.on('error', async error => {
      await errHandle(error)
    })
    // 无法保证异步报错出现在cb之前
    d.run(async () => {
      try {
        await func()
      } catch (error) {
        await errHandle(error)
      }
      d.exit()
      cb && await cb()
    })
  }

  static loadPackageEnv() {
    const packageDir = path.dirname(path.dirname(__dirname))
    if (!process.env.NODE_PATH) {
      process.env.NODE_PATH = packageDir
    } else {
      throw new Error("NODE_PATH  has value!")
    }
    require('module').Module._initPaths()
  }
}