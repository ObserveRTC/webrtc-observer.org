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
import { MainEmitter } from "./common/MainEmitter";
import { createObservedCallLogMonitor } from "./observer-listeners/ObservedCallLogMonitor";
import { HamokService } from "./services/HamokService";
import { createPipeTransportListener } from "./hamok-listeners/CreatePipeTransportListener";
import { createConnectPipeTransportListener } from "./hamok-listeners/ConnectPipeTransportListener";
import { createRandomCallId } from "./common/utils";
import { createConsumeMediaProducerListener } from "./hamok-listeners/ConsumeMediaProducerListener";
import { createPipeMediaProducerToListener } from "./hamok-listeners/PipeMediaProducerToListener";
import { createPipedMediaConsumerClosedListener } from "./hamok-listeners/PipedMediaConsumerClosedListener";
import { createGetClientProducersListener } from "./hamok-listeners/GetClientProducersListener";
import { IntervalTrackerService } from "./services/IntervalTrackerService";
import { createCloseClientInterval } from "./intervals/CloseClientInterval";
import { createClientMonitorSampleListener } from "./hamok-listeners/ClientMonitorSampleListener";

const logger = createLogger('main');
const mediasoupService = new MediasoupService(config.mediasoup);
const hamokService = new HamokService(config.hamok);
const mainEmitter = new MainEmitter();
const intervalTrackerService = new IntervalTrackerService();
const observer = createObserver({
    maxCollectingTimeInMs: 1000,
    maxReports: 100,
    defaultMediaUnitId: 'webapp',
    defaultServiceId: 'demo-service',
});
const server = new Server(config.server);

server.messageListeners
    .set('join-call-request', createJoinCallRequestListener({
        hamokService,
        mediasoupService,
        maxTransportsPerRouter: config.maxTransportsPerRouter,
        stunnerAuthUrl: config.stunnerAuthUrl,
        clientMaxLifetimeInMs: config.maxClientLifeTimeInMins * 60 * 1000,
    }))
    .set('connect-transport-request', createConnectTransportRequestListener({
        mediasoupService,
    }))
    .set(
        'control-consumer-notification',
        createControlConsumerNotificationListener({
            mediasoupService,
        })
    )
    .set(
        'control-producer-notification',
        createControlProducerNotificationListener({
            mediasoupService,
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
            hamokService,
            maxProducerPerClients: config.maxProducerPerClients,
            mediasoupService,
        })
    )
    .set(
        'create-transport-request', 
        createCreateTransportRequestListener({
            hamokService,
            mediasoupService,
            server,
        })
    )
    .set(
        'client-monitor-sample-notification',
        createClientMonitorSampleNotificatinListener({
            hamokService,
        })
    )
    .set('observer-request', 
        createObserverRequestListener({
            observer,
        })
    )
    ;

hamokService
    .on('call-inserted-by-this-instance', call => {
        if (observer.observedCalls.has(call.callId)) {
            logger.warn(`Call ${call.callId} already observed`);
            return;
        }
        observer.createObservedCall({
            roomId: call.roomId,
            callId: call.callId,
            serviceId: 'demo-service',
            appData: {},
        });
    })
    .on('call-ended', call => {
        const routers = [...mediasoupService.routers.values()].filter(router => router.appData.callId === call.callId);
        routers.forEach(router => router.close());

        observer.observedCalls.get(call.callId)?.close();
        
    })
    .on('client-left', (callId, clientId) => {
        observer.observedCalls.get(callId)?.clients.get(clientId)?.close();
    })
    .on('client-sample', createClientMonitorSampleListener({
        observer,
        mainEmitter,
    }))
    .on('create-pipe-transport-request', createPipeTransportListener({
        mediasoupService,
    }))
    .on('connect-pipe-transport-request', createConnectPipeTransportListener({
        mediasoupService
    }))
    .on('pipe-media-producer-to', createPipeMediaProducerToListener({
        mediasoupService,
        hamokService,
    }))
    .on('consume-media-producer', createConsumeMediaProducerListener({
        mediasoupService,
        server,
    }))
    .on('piped-media-consumer-closed', createPipedMediaConsumerClosedListener({
        mediasoupService,
    }))
    .on('get-client-producers-request', createGetClientProducersListener({
        mediasoupService,
        server,
    }))
    ;

intervalTrackerService.addInterval('closing-clients', createCloseClientInterval({
    server,
    maxClientLifeTimeInMins: config.maxClientLifeTimeInMins,
}))

observer.on('newcall', createObservedCallLogMonitor());

mediasoupService.connectRemotePipeTransport = (options) => hamokService.connectRemotePipeTransport(options);
mediasoupService.createRemotePipeTransport = (options) => hamokService.createRemotePipeTransport(options);
mediasoupService.pipeRemoteMediaProducerTo = (options) => hamokService.pipeMediaProducerTo(options);

server.createClientContext = async ({ clientId, webSocket, send, callId, userId }): Promise<ClientContext> => {
    let roomId: string | undefined;
    
    if (callId) {
        const ongoingCall = hamokService.calls.get(callId);
        if (!ongoingCall) {
            throw new Error(`Call ${callId} not found`);
        }
        roomId = ongoingCall.roomId;
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
            
            hamokService.leaveClient(client.clientId).catch(err => logger.warn(`Error occurred while trying to leave client ${client.clientId} %o`, err));
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
            hamokService.stop(),
        ]);
        
        process.exit(0);
    });

    logger.info("Loaded config %s", getConfigString());

    try {
        require('./appendixes').run(mainEmitter);
        // do stuff
    } catch (ex) {
        logger.warn("Error loading module %o", ex);
    }

    await hamokService.start();
    await mediasoupService.start();
    await server.start();

    intervalTrackerService.start();
}


main()
    