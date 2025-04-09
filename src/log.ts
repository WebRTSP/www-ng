import Log from 'loglevel'

const originalMethodFactory = Log.methodFactory
Log.methodFactory = (methodName, logLevel, loggerName) => {
  const originalMethod = originalMethodFactory(methodName, logLevel, loggerName)
  return (...args) => {
    if(loggerName) {
        originalMethod(`[${String(loggerName)}]`, ...args)
    } else {
        originalMethod(...args)
    }
  }
}

export default Log
