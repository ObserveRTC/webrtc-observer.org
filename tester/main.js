const Assistant = require('./Assistant.js');
const pjson = require('./package.json');
const { createLogger } = require('./logger.js');
const { sleep } = require('./utils.js');
const fs = require('fs');
const args = require('args-parser')(process.argv);


const dotenv = require('dotenv');
dotenv.config();

const RUNNING_ENV = process.env.RUNNING_ENV || "No Running Environment is Defined";
// const ICE_SERVER_URL = process.env.ICE_SERVER_URL || "stun:stun.l.google.com:19302";
const DEBUG_MODE = process.env.DEBUG_MODE === "true"
const PUPETEER_EXECUTABLE_PATH = process.env.PUPETEER_EXECUTABLE_PATH;
const SCREENSHOTS_DIR = process.env.SCREENSHOTS_DIR;
const APPLICATION_NAME = pjson.name;
const APPLICATION_VERSION = pjson.version;

const logger = createLogger("main");

logger.log("screenshots dir", SCREENSHOTS_DIR);
logger.log("Pupeteer executable path (in case of undefined the default is used)", PUPETEER_EXECUTABLE_PATH);

async function main () {
    console.info(args);

    if (args.doScreenshots) {
        console.log("Resetting screenshots directory");
        await fs.promises.rmdir(SCREENSHOTS_DIR, { recursive: true });
        await fs.promises.mkdir(SCREENSHOTS_DIR, { recursive: true });
    }

    const assistant = Assistant.builder()
        .withAppName(APPLICATION_NAME)
        .withAppVersion(APPLICATION_VERSION)
        .withDebugMode(DEBUG_MODE && true)
        .withPupeteerExecutablePath(PUPETEER_EXECUTABLE_PATH)
        .withScreenshotsDirectory(args.doScreenshots ? SCREENSHOTS_DIR : undefined)
        .withRunningEnv(RUNNING_ENV)
        .withBaseUrl('http://www.webrtc-observer.org/')
        .build();

        assistant
            .onStartedCall(obj => {
                logger.log("Started Call", obj);
            })
            .onEndedCall(obj => {
                logger.log("Ended Call", obj);
            })
            .onCallStateChanged(obj => {
                logger.log("State of Call is changed", obj);
            })
            .onClosed(() => {
                logger.log(`Assistant with id ${assistant.id} is closed`);
            })
            .onError(error => {
                logger.error(`An error occurred while Assistant is running`, error);
            });

    const call = await assistant.startCall({
        callId: args.callId,
    });

    console.log("Call", call.callId);
    await sleep(3000);
    console.log("Joining the call");

    const joiningPromises = [];
    if (Number.isFinite(args.joiningPeers) && 0 < args.joiningPeers) {
        for (let i = 0; i < args.joiningPeers; i++) {
            joiningPromises.push(assistant.startCall({
                callId: call.callId,
            }));
        }
    
        await Promise.all(joiningPromises);
    }


    await sleep(10000);

    assistant.close();
}

main();

