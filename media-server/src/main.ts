import { Server } from "./Server";
import process from'process';
import { createLogger } from "./common/logger";
import { config, getConfigString } from "./config";
import { createCreateTransportRequestListener } from "./client-listeners/CreateTransportRequestListener";
import { MediasoupService } from "./services/MediasoupService";
import { createControlProducerNotificationListener } from "./client-listeners/ControlProducerNotificationListener";
import { createControlConsumerNotificationListener } from "./client-listeners/ControlConsumerNotificationListener";
import { createCreateProducerRequestListener } from "./client-listeners/CreateProducerRequestListener";
import { ClientContext } from "./common/ClientContext";
import { createObserver } from "@observertc/observer-js";
import { createJoinCallRequestListener } from "./client-listeners/JoinCallRequestListener";
import { createControlTransportNotificationListener } from "./client-listeners/ControlTransportNotificationListener";
import { createConnectTransportRequestListener } from "./client-listeners/ConnectTransportRequestListener";
import { createClientMonitorSampleNotificatinListener } from "./client-listeners/ClientMonitorSampleNotificationListener";
import { createObserverRequestListener } from "./client-listeners/ObserverRequestListener";
import { createObservedCallLogMonitor } from "./observer-listeners/ObservedCallLogMonitor";
import { createRandomCallId } from "./common/utils";
import { IntervalTrackerService } from "./services/IntervalTrackerService";
import { createCloseClientInterval } from "./intervals/CloseClientInterval";
import { createObservedCallStatsMonitor } from "./observer-listeners/ObservedCallStatsMonitor";
import { CloudSfu } from "@l7mp/cloud-sfu-client";
declare global {
    interface BigInt {
        toJSON(): Number;
    }
}

BigInt.prototype.toJSON = function () { return Number(this) }

const logger = createLogger('main');
const mediasoupService = new MediasoupService(config.mediasoup);
// const hamokService = new HamokService(config.hamok);
// const mainEmitter = new MainEmitter();
const intervalTrackerService = new IntervalTrackerService();
const observer = createObserver({
    maxCollectingTimeInMs: 1000,
    maxReports: 100,
    defaultMediaUnitId: 'webapp',
    defaultServiceId: 'demo-service',
});
const server = new Server(config.server);
const cloudSfu = new CloudSfu({
    apiKey: '123456',
    apiSecret: '123456',
    baseUrl: 'http://localhost:8080/connect-rpc',
    orgId: '123456-1234-1234-1234-1234567890',
    appData: {

    }
});

// const router = await cloudSfu.createRouter({
//     preferredRegionIds: []
// })

// const transport = await router.createWebRtcTransport({
//     preferredRegionId: ''
// })


server.messageListeners
    .set('join-call-request', createJoinCallRequestListener({
        cloudSfu,
        maxTransportsPerRouter: config.maxTransportsPerRouter,
        // stunnerAuthUrl: config.stunnerAuthUrl,
        clientMaxLifetimeInMs: config.maxClientLifeTimeInMins * 60 * 1000,
    }))
    .set('connect-transport-request', createConnectTransportRequestListener({
        mediasoupService,
    }))
    .set(
        'control-consumer-notification',
        createControlConsumerNotificationListener({
            cloudSfu,
        })
    )
    .set(
        'control-producer-notification',
        createControlProducerNotificationListener({
            cloudSfu,
        })
    )
    .set(
        'control-transport-notification',
        createControlTransportNotificationListener({
            mediasoupService,
        })
    )
    .set(
        'create-producer-request',
        createCreateProducerRequestListener({
            cloudSfu,
            maxProducerPerClients: config.maxProducerPerClients,
        })
    )
    .set(
        'create-transport-request', 
        createCreateTransportRequestListener({
            cloudSfu,
            server,
        })
    )
    .set(
        'client-monitor-sample-notification',
        createClientMonitorSampleNotificatinListener({
            cloudSfu,
        })
    )
    .set('observer-request', 
        createObserverRequestListener({
            observer,
        })
    )
    ;

intervalTrackerService.addInterval('closing-clients', createCloseClientInterval({
    server,
    maxClientLifeTimeInMins: config.maxClientLifeTimeInMins,
}))

observer
    .on('newcall', createObservedCallLogMonitor())
    .on('newcall', createObservedCallStatsMonitor())
    ;

server.createClientContext = async ({ clientId, webSocket, send, callId, userId }): Promise<ClientContext> => {
    let roomId: string | undefined;
    
    if (callId) {
        // const ongoingCall = hamokService.calls.get(callId);
        // if (!ongoingCall) {
            // throw new Error(`Call ${callId} not found`);
        // }
        // roomId = ongoingCall.roomId;
    } else {
        [ roomId, callId ] = createRandomCallId();
    }

    if (!roomId || !callId) throw new Error(`Invalid roomId or callId`);

    return {
        created: Date.now(),
        clientId,
        webSocket,
        send,
        callId,
        roomId,
        userId,
        mediaProducers: new Set(),
        mediaConsumers: new Set(),
    };
}

server
    .on('newclient', client => {
        client.webSocket.once('close', () => {
            client.sndTransport?.close();
            client.rcvTransport?.close();
            
            // hamokService.leaveClient(client.clientId).catch(err => logger.warn(`Error occurred while trying to leave client ${client.clientId} %o`, err));
        });
        logger.info(`New client connected with id ${client.clientId}`);
    })

async function main(): Promise<void> {
    let stopped = false;
    process.on('SIGINT', async () => {
        if (stopped) return;
        stopped = true;

        logger.info("Stopping server");
        intervalTrackerService.stop();

        await Promise.allSettled([
            server.stop(),
            mediasoupService.stop(),
            // hamokService.stop(),
        ]);
        
        process.exit(0);
    });

    logger.info("Loaded config %s", getConfigString());

    try {
        // require('./appendixes').run(mainEmitter);
        // do stuff
    } catch (ex) {
        logger.warn("Error loading module %o", ex);
    }

    // await hamokService.start();
    await mediasoupService.start();
    await server.start();

    intervalTrackerService.start();
}


main()
    