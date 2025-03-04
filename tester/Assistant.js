// const puppeteer = require('puppeteer-extra');
const puppeteer = require('puppeteer');
const { PageParamNames } = require('./constants');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');
const { createLogger } = require("./logger")
const { sleep } = require("./utils");

// const StealthPlugin = require('puppeteer-extra-plugin-stealth')
// puppeteer.use(StealthPlugin());

const process = require('process');

const isMac = process.platform === "darwin";
const isWin = process.platform === "win32";

const ON_CLOSED_EVENT_NAME = "onClosed";
const ON_ERROR_EVENT_NAME = "onError";
const ON_CALL_STARTED_EVENT_NAME = "onCallJoined";
const ON_CALL_ENDED_EVENT_NAME = "onCallEnded";
const ON_CALL_STATE_CHANGED_EVENT_NAME = "onCallStateChanged";

const makeReadonlyWindowProperty = (page, name, value) => {
  page.evaluateOnNewDocument(`
    Object.defineProperty(window, '${name}', {
      get() {
        return '${value}'
      }
    })
  `)
};

const logger = createLogger("Assistant");

class Assistant {
    static builder() {
        const assistant = new Assistant();
        const result = {
            withDebugMode: (value) => {
                assistant._dumpio = value;
                return result;
            },
            withRunningEnv: (value) => {
                assistant._runningEnv = value;
                return result;
            },
            withScreenshotsDirectory: (value) => {
                assistant._screenshotsDir = value;
                return result;
            },
            withBaseUrl: (value) => {
                assistant._baseUrl = value;
                return result;
            },
            withVideoPath: (path) => {
                assistant._videoPath = path;
                return result;
            },
            withAudioPath: (path) => {
                assistant._audioPath = path;
                return result;
            },
            withAppName: (appName) => {
                assistant._appName = appName;
                return result;
            },
            withAppVersion: (appVersion) => {
                assistant._appVersion = appVersion;
                return result;
            },
            withPupeteerExecutablePath: (executablePath) => {
                if (executablePath) {
                    assistant._executablePath = executablePath;
                }
                return result;
            },
            build: () => {
                return assistant;
            }
        };
        return result;
    }

    constructor() {
        this._id = uuidv4()
        this._emitter = new EventEmitter();
        this._closed = false;
        this._appName = "hijacker";
        this._appVersion = "0.0.0";
        this._videoPath = "./empty.y4m";
        this._audioPath = "./empty.wav";
        this._dumpio = false;
        this._browser = undefined;
        this._executablePath = undefined;
        this._screenshotsDir = undefined;
        this._calls = new Map();
        this._init = undefined;
        this._runningEnv = "Not Defined";
        this._history = [];
        this._baseUrl = "http://localhost:3000";
    }

    get id() {
        return this._id;
    }

    get closed() {
        return this._closed;
    }

    async init() {
        if (this._init) {
            return this._init;
        }
        this._init = new Promise(async resolve => {
            if (!this._browser) {
                this._browser = await this._loadBrowser();
            }
            this._ready = true;
            resolve();
        });
        return this._init;
    }

    teardown() {
        logger.log(`Teardown for Assistant is called ${this._id}`);
        const check = () => {
            if (0 < this._calls.size) {
                return false;
            }
            logger.log(`No more calls Assistant has ${this._id}`);
            this.close();
            return true;
        }
        if (!check()) {
            this.onEndedCall(() => {
                check();
            })    
        }
    }

    async startCall({ callId }) {
        if (!this._browser) {
            this._browser = await this._loadBrowser();
        }
        const page = await this._loadPage(this._browser);
        const call = await this._join({
            page,
            callId,
        });
        this._calls.set(callId, call);

        return call;
    }

    async endCall(callId) {
        const call = this._calls.get(callId);
        if (!call) {
            logger.info(`Attempted to remove a call (${callId}) does not exists`);
            return false;
        }
        
        logger.info(`End call ${callId}`);
        call.page.close();
        this._calls.delete(callId);
        return true;
    }

    close() {
        if (this._closed) {
            return;
        }
        logger.info("Closing Assistant");
        this._closed = true;
        const promises = [];
        for (const callId of Array.from(this._calls.keys())) {
            const promise = this.endCall(callId);
            promises.push(promise);
        }
        Promise.all(promises);
        this._emitter.emit(ON_CLOSED_EVENT_NAME);
    }

    onStartedCall(listener) {
        this._emitter.on(ON_CALL_STARTED_EVENT_NAME, listener);
        return this;
    }

    onEndedCall(listener) {
        this._emitter.on(ON_CALL_ENDED_EVENT_NAME, listener);
        return this;
    }

    onCallStateChanged(listener) {
        this._emitter.on(ON_CALL_STATE_CHANGED_EVENT_NAME, listener);
        return this;
    }

    onError(listener) {
        this._emitter.on(ON_ERROR_EVENT_NAME, listener);
        return this;
    }

    onClosed(listener) {
        this._emitter.on(ON_CLOSED_EVENT_NAME, listener);
        return this;
    }

    setScreenshotsDir(value) {
        this._screenshotsDir = value;
    }

    getReport(reset = false) {
        const ongoingCalls = this._calls.size;
        let finishedCalls = 0;
        let totalDurationInMins = 0;
        let maxDurationInMins = 0;
        let minDurationInMins = undefined;
        for (const record of this._history) {
            const { durationInMins } = record;
            ++finishedCalls;
            totalDurationInMins += durationInMins;
            if (minDurationInMins === undefined || durationInMins < minDurationInMins) {
                minDurationInMins = durationInMins;
            }
            if (maxDurationInMins < durationInMins) {
                maxDurationInMins = durationInMins;
            }
        }
        if (reset) {
            this._history = [];
        }
        return {
            ongoingCalls,
            finishedCalls,
            totalDurationInMins,
            avgDurationInMins: 0 < finishedCalls ? totalDurationInMins / finishedCalls : 0,
            maxDurationInMins,
            minDurationInMins: minDurationInMins ?? 0
        }
    }

    async _loadBrowser() {
        const params = {
            headless: true,
            ignoreHTTPSErrors: true,
            // ignoreDefaultArgs: true,
            defaultViewport: {
                width: 1024,
                height: 768,
                deviceScaleFactor: 1,
                isMobile: false,
                hasTouch: false,
                isLandscape: false,
            },
            args: [ 
                '--no-sandbox',
                '--no-zygote',
                '--ignore-certificate-errors',
                '--no-user-gesture-required',
                '--autoplay-policy=no-user-gesture-required',
                '--disable-infobars',
                // `${'--force-fieldtrials=' +
                    // 'AutomaticTabDiscarding/Disabled' +
                    // '/WebRTC-Vp9DependencyDescriptor/Enabled' +
                    // '/WebRTC-DependencyDescriptorAdvertised/Enabled'}${
                    // config.audioRedForOpus ?
                    // '/WebRTC-Audio-Red-For-Opus/Enabled' : ''}`,
                // '--renderer-process-limit=1',
                '--single-process',
                '--use-fake-ui-for-media-stream',
                '--use-fake-device-for-media-stream',
                '--mute-audio',
                '--allow-running-insecure-content',
                // `--use-file-for-fake-video-capture=${this._videoPath}`,
                `--use-file-for-fake-audio-capture=${this._audioPath}`,
                // `--unsafely-treat-insecure-origin-as-secure=${this._sfuServerUrl}`,
                "--enable-automation",
            ],
            dumpio: this._dumpio,
        };
        if (this._executablePath) {
            params.executablePath = this._executablePath;
        }
        const browser = await puppeteer.launch(params);
        return browser;
    }

    async _loadPage(browser) {
        const page = await browser.newPage({
            // preload: "./bundles/bundled-google-rtc-hijacker.js"
        });
        // const userAgentStr = userAgent.random().toString();
        // let userAgentStr;
        // if (isMac) {
        //     userAgentStr = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36`;
        // } else {
        //     userAgentStr = "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Chrome/106.0.0.0";
        // }
        // await page.setUserAgent(userAgentStr);
        page.on('console', msg => {
            const text = msg.text();
            logger.log(text);
        });
        const pageId = uuidv4().slice(0, 8);
        let screenshotsTimer;
        if (this._screenshotsDir) {
            let index = 0;
            screenshotsTimer = setInterval(async () => {
                await page.screenshot({                      // Screenshot the website using defined options
                    path: `${this._screenshotsDir}/screenshot-${pageId}-${index}.png`,
                    fullPage: true                              // take a fullpage screenshot
                }).catch(err => {
                    logger.error(`Error occurred while trying to take screenshot`, err);
                    clearInterval(screenshotsTimer);
                })
                ++index;
            }, 2000);
        }
        page.on('close', () => {
            if (screenshotsTimer) {
                clearInterval(screenshotsTimer);
            }
            logger.log("Page is closed");
        });

        
        return page;
    }

    async _join({ page, callId }) {
        let awaiter = () => Promise.resolve();
        
        if (callId) {
            console.log("\n\n\n\nCallId is provided!!!!!\n\n\n\n", callId);
            makeReadonlyWindowProperty(page, PageParamNames.callId, callId);
        } else {
            awaiter = () => new Promise((resolve, reject) => {
                const timer = setInterval(async () => {
                    callId = await page.evaluate((callIdVarName) => {
                        return window[callIdVarName];
                    }, PageParamNames.callId);

                    if (callId) {
                        console.log("CallId is ready", callId);
                        clearInterval(timer);
                        resolve();
                    } else {
                        console.log("Waiting for callId");
                    }
                }, 1000);
            });
        }
        // await page.goto('https://www.webrtc-observer.org/');
        const url = this._baseUrl + (callId ? `?callId=${callId}` : "");
        
        await page.goto(url);
        await sleep(2000);
        await page.addScriptTag({ path: "./bundles/webrtc-observer-call.js"});

        await awaiter();

        return {
            page,
            callId,
        }
    }

}

module.exports = Assistant;