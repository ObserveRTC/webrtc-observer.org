import { Server } from "./Server";
import process from'process';
import { createLogger } from "./common/logger";
import { ClientMessage } from "./protocols/MessageProtocol";
import { ClientMessageListener } from "./client-listeners/ClientMessageListener";
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
import { ClientSampleDecoder as LatestClientSampleDecoder, schemaVersion as latestSchemaVersion } from "@observertc/samples-decoder";
import { createClientMonitorSampleNotificatinListener } from "./client-listeners/ClientMonitorSampleNotificationListener";
import { createObserverRequestListener } from "./client-listeners/ObserverRequestListener";
import { MainEmitter } from "./common/MainEmitter";
import { createObservedCallLogMonitor } from "./observer-listeners/ObservedCallLogMonitor";

const logger = createLogger('main');
const clients = new Map<string, ClientContext>();
const server = new Server(config.server);
const mediasoupService = new MediasoupService(config.mediasoup);
const mainEmitter = new MainEmitter();
const observer = createObserver({
    maxCollectingTimeInMs: 1000,
    maxReports: 100,
    defaultMediaUnitId: 'webapp',
    defaultServiceId: 'demo-service',
});
const listeners = new Map<ClientMessage['type'], ClientMessageListener>()
    .set('join-call-request', createJoinCallRequestListener({
        mediasoupService,
        clients,
        maxTransportsPerRouter: config.maxTransportsPerRouter,
    }))
    .set('connect-transport-request', createConnectTransportRequestListener({
        mediasoupService,
        clients, 
    }))
    .set(
        'control-consumer-notification',
        createControlConsumerNotificationListener({
            clients,
            mediasoupService,
        })
    )
    .set(
        'control-producer-notification',
        createControlProducerNotificationListener({
            clients,
            mediasoupService,
        })
    )
    .set(
        'control-transport-notification',
        createControlTransportNotificationListener({
            clients,
            mediasoupService,
        })
    )
    .set(
        'create-producer-request',
        createCreateProducerRequestListener({
            clients,
            mediasoupService,
            maxProducerPerClients: config.maxProducerPerClients,
        })
    )
    .set(
        'create-transport-request', 
        createCreateTransportRequestListener({
            mediasoupService,
            server,
            clients,
        })
    )
    .set(
        'client-monitor-sample-notification',
        createClientMonitorSampleNotificatinListener({
            observer,
            clients,
            mainEmitter,
        })
    )
    .set('observer-request', 
        createObserverRequestListener({
            observer,
            clients,
        })
    )
    ;

observer.on('newcall', createObservedCallLogMonitor());

server
    .on('newclient', client => {
        client.webSocket.once('close', () => {
            client.sndTransport?.close();
            client.rcvTransport?.close();
            clients.delete(client.clientId)
            logger.info(`Client disconnected with id ${client.clientId}`);
        });
        let decoder: LatestClientSampleDecoder | undefined;
        switch (client.schemaVersion) {
            case latestSchemaVersion:
                decoder = new LatestClientSampleDecoder();
                logger.debug(`Client ${client.clientId} uses schema version ${client.schemaVersion}`);
                break;
            default: {
                logger.warn(`Unsupported schema version ${client.schemaVersion}`);
            }
        }
        client.decoder = decoder;
        clients.set(client.clientId, client);
        logger.info(`New client connected with id ${client.clientId}`);
    })
    .on('newmessage', messageContext => {
        const listener = listeners.get(messageContext.message.type);
        if (!listener) {
            logger.warn(`No listener found for message type ${messageContext.message.type}`);
            return;
        }
        listener(messageContext)?.catch(err => {
            logger.error(`Error occurred while processing message`, err);
        });
    })

async function main(): Promise<void> {
    let stopped = false;
    process.on('SIGINT', async () => {
        if (stopped) return;
        stopped = true;

        logger.info("Stopping server");
        await Promise.allSettled([
            server.stop(),
            mediasoupService.stop(),
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

    await mediasoupService.start();
    await server.start();
}


main()
    