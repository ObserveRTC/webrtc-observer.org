const createCompletablePromise = () => {
    let resolve = () => {};
    let reject = () => {};
    const promise = new Promise((_resolve, _reject) => {
        resolve = (...data) => {
            _resolve(...data);
        };
        reject = (err) => {
            _reject(err);
        };
    });
    return {
        promise,
        resolve,
        reject
    };
}

const sleep = async (timeoutInMs) => new Promise(resolve => {
    if (!timeoutInMs) {
        throw new Error(`Cannot perform a sleep without a timeout`);
    }
    setTimeout(() => {
        resolve();
    }, timeoutInMs);
})

module.exports = {
    createCompletablePromise,
    sleep
}