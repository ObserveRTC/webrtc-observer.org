let logFn = (...args) => console.log(...args);
let infoFn = (...args) => console.info(...args);
let warnFn = (...args) => console.warn(...args);
let errorFn = (...args) => console.error(...args);
let captureError = (error) => console.error(error);

const getLogLevel = (level) => {
    switch (level) {
        case undefined:
            return 0;
        case 'trace':
        case 'log':
        case 'debug':
            return 1;
        case 'info':
            return 2;
        case 'warn':
            return 3;
        case 'error':
            return 4;
    }
}

function createLogger(moduleName, level) {
    const logLevel = getLogLevel(level);
    console.log("Creating logger for ", moduleName, "level", logLevel);
    const log = logLevel <= 1 ? (...args) => {
        logFn(`[LOG] ${moduleName} - ${new Date().toGMTString()}`, ...args);
    } : () => {};
    const info = logLevel <= 2 ? (...args) => {
        infoFn(`[INFO] ${moduleName} - ${new Date().toGMTString()}`, ...args);
    } : () => {};
    const warn = logLevel <= 3 ? (...args) => {
        warnFn(`[WARN] ${moduleName} - ${new Date().toGMTString()}`, ...args);
    } : () => {};
    const error = logLevel <= 4 ? (...args) => {
        errorFn(`[ERROR] ${moduleName} - ${new Date().toGMTString()}`, ...args);
    } : () => {};

    return {
        log,
        info,
        warn,
        error,
        captureError
    }
}

const defaultLogger = {
    log: logFn,
    info: infoFn,
    warn: warnFn,
    error: errorFn,
    captureError
}

module.exports = {
    createLogger,
    defaultLogger,
}
