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
const SCREENSHOTS_DIR = process.env.SCREENSHOTS_DIR || "./screenshots";
const APPLICATION_NAME = pjson.name;
const APPLICATION_VERSION = pjson.version;
const MEASUREMENT_LENGTH_IN_SECONDS = parseInt(process.env.MEASUREMENT_LENGTH || "10", 10);
const VIDEO_PATH = process.env.VIDEO_PATH || "bbb.y4m";

const logger = createLogger("main");

logger.log("screenshots dir", SCREENSHOTS_DIR);
logger.log("video path", VIDEO_PATH);
logger.log("Pupeteer executable path (in case of undefined the default is used)", PUPETEER_EXECUTABLE_PATH);

if (!fs.existsSync(VIDEO_PATH)) {
    logger.log("Input Video file not found:", VIDEO_PATH);
    logger.log("Aborting..");
    process.exit(1);
}

async function main () {
    console.info(args);

    if (args.doScreenshots) {
        logger.log("Resetting screenshots directory");
        await fs.promises.rm(SCREENSHOTS_DIR, { recursive: true, force: true });
        await fs.promises.mkdir(SCREENSHOTS_DIR, { recursive: true });
    }

    const assistant = Assistant.builder()
        .withAppName(APPLICATION_NAME)
        .withAppVersion(APPLICATION_VERSION)
        .withDebugMode(DEBUG_MODE && true)
        .withVideoPath(VIDEO_PATH)
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

    logger.log("Call", call.callId);
    await sleep(3000);
    logger.log("Joining the call");

    const joiningPromises = [];
    if (Number.isFinite(args.joiningPeers) && 0 < args.joiningPeers) {
        for (let i = 0; i < args.joiningPeers; i++) {
            joiningPromises.push(assistant.startCall({
                callId: call.callId,
            }));
        }

        await Promise.all(joiningPromises);
    }

    await sleep(MEASUREMENT_LENGTH_IN_SECONDS * 1000);

    assistant.close();
    await sleep(1000);
    logger.log("Exiting..");
    process.exit(0);
}


if (Number.isFinite(args.numRooms) && 0 < args.numRooms) {
    for (let i = 0; i < args.numRooms; i++) {
	main();
    }
} else {
    main();
}
