exports.isDev = process.env.NODE_ENV && process.env.NODE_ENV === "development" || process.env.COPHA_DEBUG

exports.homedir = function () {
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
