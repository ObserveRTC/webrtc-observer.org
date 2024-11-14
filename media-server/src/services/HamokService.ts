import { EventEmitter } from "events"
import { addHamokLogTransport, Hamok, HamokEmitter, HamokEmitterBuilderConfig, HamokMap, HamokMapBuilderConfig, HamokMessage, setHamokLogLevel } from "hamok"
import Redis, { RedisOptions } from "ioredis"
import { v4 as uuid } from "uuid"
import { createLogger } from "../common/logger";
import { 
    HamokServiceClientSampleEventPayload, 
    HamokServiceConnectPipeTransportRequestPayload, 
    HamokServiceConnectPipeTransportResponsePayload, 
    HamokServiceConsumeMediaProducerEventPayload, 
    HamokServiceCreatePipeTransportRequestPayload, 
    HamokServiceCreatePipeTransportResponsePayload, 
    HamokServiceGetClientProducersRequestPayload, 
    HamokServiceGetClientProducersResponsePayload, 
    HamokServicePipeMediaConsumerClosedEventPayload, 
    HamokServicePipeMediaProducerToRequestPayload, 
    HamokServicePipeMediaProducerToResponsePayload, 
    HamokServiceResponseField 
} from "../protocols/HamokServiceEventProtocol";

const logger = createLogger('HamokService');

export type HamokServiceEventMap = {
    'call-created': [call: OngoingCall],
    'call-inserted-by-this-instance': [call: OngoingCall],
    'call-ended': [call: OngoingCall],
    'client-left': [callId: string, clientId: string],
    
    // emitter events
    'client-sample': [payload: HamokServiceClientSampleEventPayload],
    'create-pipe-transport-request': [
        payload: HamokServiceCreatePipeTransportRequestPayload, 
        resolve: HamokServiceResponseField<HamokServiceCreatePipeTransportResponsePayload>,
    ],
     'connect-pipe-transport-request': [
        payload: HamokServiceConnectPipeTransportRequestPayload, 
        resolve: HamokServiceResponseField<HamokServiceConnectPipeTransportResponsePayload>
    ],
     'pipe-media-producer-to': [
        payload: HamokServicePipeMediaProducerToRequestPayload, 
        resolve: HamokServiceResponseField<HamokServicePipeMediaProducerToResponsePayload>,
    ],
     'consume-media-producer': [
        payload: HamokServiceConsumeMediaProducerEventPayload
    ],
     'get-client-producers-request': [
        options: HamokServiceGetClientProducersRequestPayload, 
        resolve: HamokServiceResponseField<HamokServiceGetClientProducersResponsePayload>
    ],
    'piped-media-consumer-closed': [
        payload: HamokServicePipeMediaConsumerClosedEventPayload
    ],
}


type HamokEmitterEventMap = {
    'client-sample': [message: HamokServiceClientSampleEventPayload],
    'create-pipe-transport-request': [
        requestId: string, 
        payload: HamokServiceCreatePipeTransportRequestPayload
    ],
    'connect-pipe-transport-request': [
        requestId: string, 
        payload: HamokServiceConnectPipeTransportRequestPayload
    ],
    'consume-media-producer': [
        payload: HamokServiceConsumeMediaProducerEventPayload
    ],
    'get-client-producers-request': [
        requestId: string, 
        payload: HamokServiceGetClientProducersRequestPayload
    ],
    'pipe-media-producer-to': [
        requestId: string,
        payload: HamokServicePipeMediaProducerToRequestPayload
    ],
    'piped-media-consumer-closed': [
        payload: HamokServicePipeMediaConsumerClosedEventPayload
    ],
    'response': [
        requestId: string, 
        response: {
            error?: string, 
            payload?: unknown 
        }
    ],
}

export type OngoingCall = {
    roomId: string;
    callId: string;
}

export type ActiveClient = {
    roomId: string,
    callId: string,
    clientId: string,
    userId: string, 
    routerId: string,
    turnUris: string[],
    mediaServerIp: string,
}


export type HamokServiceConfig = {
    redis: RedisOptions,
    redisChannelId: string,
    roomsMap: Pick<HamokMapBuilderConfig<string, OngoingCall>, 'mapId'>,
    clientsMap: Pick<HamokMapBuilderConfig<string, string>, 'mapId'>,
    eventEmitter: Pick<HamokEmitterBuilderConfig<HamokEmitterEventMap>, 'emitterId'>,
    devMode?: boolean,
}

type HamokAppData = {
}


interface HamokRedisMessageChannel extends EventEmitter<{ 'message': [HamokMessage] }>{
    send(message: HamokMessage): void;
    close(): void;
}

interface PendingRequest<T> {
    resolve(data: T): void;
    reject(error: string): void;
    timer: ReturnType<typeof setTimeout>;
}

export class HamokService extends EventEmitter<HamokServiceEventMap> {

    public run = false;

    public readonly hamok: Hamok<HamokAppData>;
    public readonly calls: HamokMap<string, OngoingCall>;
    public readonly clients: HamokMap<string, ActiveClient>;
    public readonly eventEmitter: HamokEmitter<HamokEmitterEventMap>;

    private readonly _pendingRequests = new Map<string, PendingRequest<any>>();
    private _redisConnected = false;
    private readonly _channel: HamokRedisMessageChannel;
    private _devHamok?: Hamok<HamokAppData>;

    constructor(
        config: HamokServiceConfig
    ) {
        super();
        
        this.hamok = new Hamok<HamokAppData>({
            appData: {
            }
        });
        this._channel = this._createRedisClients(config.redis, config.redisChannelId);
        this.calls = this.hamok.createMap(config.roomsMap);
        this.clients = this.hamok.createMap(config.clientsMap);
        this.eventEmitter = this.hamok.createEmitter(config.eventEmitter);

        this.calls.on('remove', (key, value) => this.emit('call-ended', value));
        this.calls.on('insert', (key, value) => this.emit('call-created', value));
        this.clients.on('remove', (key, value) => this.emit('client-left', value.callId, key));

        this._remotePeerJoined = this._remotePeerJoined.bind(this);
        this._remotePeerLeft = this._remotePeerLeft.bind(this);
        this._leaderChanged = this._leaderChanged.bind(this);

        if (config.devMode) {
            this._devHamok = new Hamok<HamokAppData>({
                appData: {
                },
                onlyFollower: true,
            });
        }
    }

    public async joinClient(activeClient: ActiveClient): Promise<void> {
        
        await this._getOrCreateCall({
            callId: activeClient.callId,
            roomId: activeClient.roomId
        });
        
        const clientAlreadyExists = await this.clients.insert(activeClient.clientId, activeClient);

        if (clientAlreadyExists) throw new Error(`Client ${activeClient.clientId} already exists`);
    }

    public async updateClient(clientId: string, update: Partial<ActiveClient>, enforced = false): Promise<boolean> {
        const activeClient = this.clients.get(clientId);

        if (!activeClient) throw new Error(`Client ${update.clientId} not found`);

        const updatedActiveClient = { ...activeClient, ...update };

        if (enforced) return this.clients.set(clientId, updatedActiveClient).then(() => true);
        else return this.clients.updateIf(clientId, updatedActiveClient, activeClient);
    }

    public async leaveClient(clientId: string): Promise<void> {
        const removedClient = this.clients.get(clientId);

        if (!removedClient) return;

        await this.clients.remove(clientId);
        await this.hamok.waitUntilCommitHead();

        let counter = 0;
        for (const [, activeClient] of this.clients.entries()) {
            if (activeClient.callId === removedClient.callId) {
                counter++;
            }
        }

        if (counter < 1) {
            await this.calls.remove(removedClient.callId);
        }
    }

    public publishClientSample(payload: HamokServiceClientSampleEventPayload): void {
        this.eventEmitter.notify('client-sample', payload);
    }

    public publishPipeMediaConsumerClosed(payload: HamokServicePipeMediaConsumerClosedEventPayload): void {
        this.eventEmitter.notify('piped-media-consumer-closed', payload);
    }

    public async getClientProducers(payload: HamokServiceGetClientProducersRequestPayload): Promise<{ mediaProducerIds: string[] }> {
        const [requestId, promise] = this._createPendingRequest({ type: 'get-client-producers-request', payload });

        this.eventEmitter.notify('get-client-producers-request', requestId, payload);

        return promise.then(payload => payload as { mediaProducerIds: string[] });
    }

    public consumeMediaProducer(payload: HamokServiceConsumeMediaProducerEventPayload): void {
        this.eventEmitter.notify('consume-media-producer', payload);
    }

    public async createRemotePipeTransport(payload: HamokServiceCreatePipeTransportRequestPayload): Promise<{ ip: string, port: number }> {
        const [requestId, promise] = this._createPendingRequest({ type: 'create-pipe-transport-request', payload });

        this.eventEmitter.notify('create-pipe-transport-request', requestId, payload);

        return promise.then(payload => payload as { ip: string, port: number });
    }

    public async connectRemotePipeTransport(payload: HamokServiceConnectPipeTransportRequestPayload): Promise<void> {
        const [requestId, promise] = this._createPendingRequest({ type: 'connect-pipe-transport-request', payload });

        this.eventEmitter.notify('connect-pipe-transport-request', requestId, payload);

        await promise;
    }

    public async pipeMediaProducerTo(payload: HamokServicePipeMediaProducerToRequestPayload): Promise<HamokServicePipeMediaProducerToResponsePayload> {
        const [requestId, promise] = this._createPendingRequest({ type: 'pipe-media-producer-to', payload });

        this.eventEmitter.notify('pipe-media-producer-to', requestId, payload);

        return promise.then(payload => payload as HamokServicePipeMediaProducerToResponsePayload);
    }

    private async _getOrCreateCall(ongoingCall: Pick<OngoingCall, 'callId' | 'roomId'>): Promise<OngoingCall> {
        const call = this.calls.get(ongoingCall.callId);
        
        if (call) return call;
        const newCall: OngoingCall = {
            ...ongoingCall,
        }
        
        const alreadyExistingCall = await this.calls.insert(ongoingCall.callId, newCall);

        if (alreadyExistingCall) {
            return alreadyExistingCall;
        }

        this.emit('call-inserted-by-this-instance', newCall);

        return newCall;
    }


    public async start() {
        if (this.run) return;
        this.run = true;

        logger.info('Starting HamokService');

        setHamokLogLevel('debug');
		addHamokLogTransport({
			target: 'pino-pretty',
  		    options: { destination: 0 } // use 2 for stderr
		})

        this.hamok.on('message', msg => this._channel.send(msg));
        this._channel.on('message', msg => this.hamok.accept(msg));
		this.hamok.on('remote-peer-joined', this._remotePeerJoined);
		this.hamok.on('remote-peer-left', this._remotePeerLeft);
		this.hamok.on('leader-changed', this._leaderChanged);
		this.hamok.on('error', (err) => logger.error('Hamok error', err));

        if (this._devHamok) {
            // for local try purpose, because hamok cannot work without at least 2 instance
            this._devHamok.on('message', msg => this.hamok.accept(msg));
            this.hamok.on('message', msg => this._devHamok?.accept(msg));
            this.hamok.once('close', () => this._devHamok?.close());

            this._devHamok.join({
                fetchRemotePeerTimeoutInMs: 2000,
                maxRetry: 50,
            }).catch(err => logger.error('Failed to join dev hamok', err));
        }

        const subscribe = async (event?: keyof HamokEmitterEventMap) => {
            if (!event || event === 'client-sample') {
                await this.eventEmitter.subscribe('client-sample', (message) => {
                    this.emit('client-sample', message);
                });
            }

            if (!event || event === 'create-pipe-transport-request') {
                await this.eventEmitter.subscribe('create-pipe-transport-request', (requestId, payload) => {
                    this.emit('create-pipe-transport-request', payload, createNonVoidResponseCallback(requestId));
                });
            }

            if (!event || event === 'connect-pipe-transport-request') {
                await this.eventEmitter.subscribe('connect-pipe-transport-request', (requestId, payload) => {
                    this.emit('connect-pipe-transport-request', payload, createVoidResponseCallback(requestId));
                });
            }

            if (!event || event === 'pipe-media-producer-to') {
                await this.eventEmitter.subscribe('pipe-media-producer-to', (requestId, payload) => {
                    this.emit('pipe-media-producer-to', payload, createNonVoidResponseCallback(requestId));
                });
            }

            if (!event || event === 'get-client-producers-request') {
                await this.eventEmitter.subscribe('get-client-producers-request', (requestId, payload) => {
                    this.emit('get-client-producers-request', payload, createNonVoidResponseCallback(requestId));
                });
            }

            if (!event || event === 'consume-media-producer') {
                await this.eventEmitter.subscribe('consume-media-producer', (payload) => {
                    this.emit('consume-media-producer', payload);
                });
            }

            if (!event || event === 'piped-media-consumer-closed') {
                await this.eventEmitter.subscribe('piped-media-consumer-closed', (payload) => {
                    this.emit('piped-media-consumer-closed', payload);
                });
            }

            if (!event || event === 'response') {
                await this.eventEmitter.subscribe('response', (requestId, response) => {
                    const pendingRequest = this._pendingRequests.get(requestId);
        
                    if (!pendingRequest) return;
        
                    clearTimeout(pendingRequest.timer);
                    if (response.error) {
                        pendingRequest.reject(response.error);
                    } else {
                        pendingRequest.resolve(response.payload);
                    }
                });
            }
        }

        this.eventEmitter.subscriptions.on('removed', (event, peerId) => {
            if (peerId !== this.hamok.localPeerId) return;
            
            const forcedSubscribe = () => {
                subscribe(event).catch(err => {
                    logger.error('Failed to subscribe to %s: %o', event, err);
                    forcedSubscribe();  
                })    
            }

            forcedSubscribe();
        })

        this.hamok.on('joined', async () => {
            logger.info('Hamok joined %s', this.eventEmitter.hasSubscribers('create-pipe-transport-request', true));
            
             await subscribe();     
        });

		await this.hamok.join({
			fetchRemotePeerTimeoutInMs: 2000,
			maxRetry: 50,
		});

        this.eventEmitter.subscriptions
            .on('added', (event, peerId, metaData) => {
                logger.debug(`Peer ${peerId} subscribed to ${event} with metadata: %o`, metaData);
            })
            .on('removed', (event, peerId) => {
                logger.debug(`Peer ${peerId} unsubscribed from ${event}`);
            })
            ;


        const createNonVoidResponseCallback = <T extends object>(requestId: string): HamokServiceResponseField<T> => ((payload?: T, error?: string) => {
            this.eventEmitter.notify('response', requestId, {
                error,
                payload,
            });
        }) as HamokServiceResponseField<T>;
        const createVoidResponseCallback = (requestId: string): HamokServiceResponseField<void> => ((err?: string) => {
            this.eventEmitter.notify('response', requestId, { 
                error: err,
                payload: err ? undefined : {}
            });
        }) as HamokServiceResponseField<void>;

        logger.info('HamokService started');
    }

    public async stop() {
        if (!this.run) return;
		this.run = false;

		logger.info('Stopping HamokService');
		this.hamok.off('remote-peer-joined', this._remotePeerJoined);
		this.hamok.off('remote-peer-left', this._remotePeerLeft);
		this.hamok.off('leader', this._leaderChanged);
		
		return this.hamok.close();
    }

    private _createPendingRequest<T>(debugInfo: Record<string, unknown>): [requestId: string, promise: Promise<T>] {
        const requestId = uuid();

        return [
            requestId,
            new Promise((_resolve, _reject) => {
                const timer = setTimeout(() => {
                    this._pendingRequests.delete(requestId);
                    _reject('Request timed out. debugInfo: ' + JSON.stringify(debugInfo));
                }, 5000);

                this._pendingRequests.set(requestId, { 
                    resolve: data => {
                        this._pendingRequests.delete(requestId);
                        _resolve(data);
                    }, 
                    reject: error => {
                        this._pendingRequests.delete(requestId);
                        _reject(error);
                    }, 
                    timer 
                });
            })
        ]
    }

    private _createRedisClients(
        config: RedisOptions,
		channelId: string,
	): HamokRedisMessageChannel {
        const redisPublisher = new Redis(config);
        const redisSubscriber = new Redis(config);
		const channel = new class extends EventEmitter<{ 'message': [message: HamokMessage] }> implements HamokRedisMessageChannel{
            send(message: HamokMessage): void {
                // logger.debug(`Sending message to channel ${channelId}:`, message);
                const data = Buffer.from(message.toBinary());
                redisPublisher.publish(channelId, data).catch((error: Error) => {
                    logger.error('Failed to publish to the redis channel', error);
                });
            }
            close(): void {
                redisSubscriber.unsubscribe(channelId, (err) => {
                    if (err) {
                        logger.error('Failed to unsubscribe from the redis channel', err);
                    }
                });
            }

        }();

		redisPublisher.on('reconnecting', () => logger.warn('Reconnecting'));
		redisPublisher.on('ready', () => logger.info('Ready'));
		redisPublisher.on('end', () => logger.warn('Connection closed (ended)'));
		redisSubscriber.on('error', (err) => logger.error('Error occurred', err));
		redisSubscriber.on('connect', () => void 0);
		redisSubscriber.on('reconnecting', () => void 0);
		redisSubscriber.on('ready', () => void 0);
		redisSubscriber.on('end', () => void 0);

        redisPublisher.on('error', (err) => {
			if (!this._redisConnected) {
				// ignore the errors
				return;
			}
			if (err?.name === 'ECONNREFUSED') {
				logger.warn('Disconnected due to error', err);
				this._redisConnected = false;
			} else {
				logger.warn('Error occurred', err);
			}
		});
		redisPublisher.on('connect', () => {
			if (this._redisConnected) {
				return;
			}
			this._redisConnected = true;

            redisSubscriber.subscribe(channelId, (err, count) => {
                if (err) {
                    return logger.error("Failed to subscribe: %s", err.message);
                }

                logger.debug(
                    `Subscribed successfully to channel ${channelId}! This client is currently subscribed to ${count} channels.`
                );
            }).catch(err => {
                logger.error('Failed to subscribe to the channel', err);
    
                channel.close();
            });
			logger.info('Connected');
		});

        redisSubscriber.on('messageBuffer', (redisChannel, data) => {
            // the only channel we subscribe to is the channelId...
            try {
                const message = HamokMessage.fromBinary(data);
                channel.emit('message', message); 
            } catch (err) {
                logger.error('Failed to parse message %o', err);
            }
        });

		return channel;
	}

    private _remotePeerJoined(peerId: string) {
		logger.info('Remote peer joined: %s', peerId);
	}

	private _remotePeerLeft(peerId: string) {
		logger.info('Remote peer left: %s', peerId);
		
		if (this.hamok.leader) {
            // if this node is the leader and another peer left, maybe we need to do something with some stuffs?
		}
	}

	private async _leaderChanged(leaderId: string | undefined) {
		if (leaderId !== this.hamok.localPeerId) {
			return;
		}
        // if this node is the leader, we need to do something with some stuffs?
	}

}
