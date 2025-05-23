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
    HamokServiceGetCallStatsRequestPayload, 
    HamokServiceGetCallStatsResponsePayload, 
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
    'get-all-call-stats-request': [
        payload: HamokServiceGetCallStatsRequestPayload, 
        resolve: HamokServiceResponseField<HamokServiceGetCallStatsResponsePayload>
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
    'get-all-call-stats-request': [
        requestId: string, 
        payload: HamokServiceGetCallStatsRequestPayload
    ],
    'response': [
        requestId: string, 
        response: {
            error?: string, 
            payload?: unknown,
            sourcePeerId?: string,
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
    private _redisState: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
    private readonly _stateLogs: string[] = [];

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
                peerId: 'dev-'+uuid(),
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

    public async getAllCallStats(payload: HamokServiceGetCallStatsRequestPayload): Promise<HamokServiceGetCallStatsResponsePayload[]> {
        const [requestId, promise] = this._createBroadcastPendingRequest({ type: 'get-all-call-stats-request', payload });

        this.eventEmitter.notify('get-all-call-stats-request', requestId, payload);

        return promise.then(payload => payload as HamokServiceGetCallStatsResponsePayload[]);
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

    public getStats() {
        
        return {
            remotePeerIds: [...this.hamok.remotePeerIds],
            localPeerId: this.hamok.localPeerId,
            leader: this.hamok.raft.leaderId,
            state: this.hamok.raft.state,
            stats: this.hamok.stats,
            redisConnected: this._redisConnected,
            redisState: this._redisState,
            stateLogs: this._stateLogs,
            emitter: {
                id: this.eventEmitter.id,
                subscriptionAllPeerIds: [...this.eventEmitter.subscriptions.getAllPeerIds()],
                'create-pipe-transport-request': [...(this.eventEmitter.subscriptions.getEventPeersMap('create-pipe-transport-request') ?? [])],
                'connect-pipe-transport-request': [...(this.eventEmitter.subscriptions.getEventPeersMap('connect-pipe-transport-request') ?? [])],
                'pipe-media-producer-to': [...(this.eventEmitter.subscriptions.getEventPeersMap('pipe-media-producer-to') ?? [])],
                'consume-media-producer': [...(this.eventEmitter.subscriptions.getEventPeersMap('consume-media-producer') ?? [])],
                'get-client-producers-request': [...(this.eventEmitter.subscriptions.getEventPeersMap('get-client-producers-request') ?? [])],
                'piped-media-consumer-closed': [...(this.eventEmitter.subscriptions.getEventPeersMap('piped-media-consumer-closed') ?? [])],
                'client-sample': [...(this.eventEmitter.subscriptions.getEventPeersMap('client-sample') ?? [])],
                'response': [...(this.eventEmitter.subscriptions.getEventPeersMap('response') ?? [])],
                'get-all-call-stats-request': [...(this.eventEmitter.subscriptions.getEventPeersMap('get-all-call-stats-request') ?? [])],
            },
        }
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

        this.hamok.on('joined', async () => {
            logger.info('Hamok joined %s', this.eventEmitter.hasSubscribers('create-pipe-transport-request', true));

            this._stateLogs.push('Hamok Joined');
        });
        this.hamok.on('rejoining', () => this._stateLogs.push('Hamok Rejoining'));
        this.hamok.on('no-heartbeat-from', (peerId) => this._stateLogs.push(`No heartbeat from ${peerId}`));

		await this.hamok.join({
			fetchRemotePeerTimeoutInMs: 2000,
			maxRetry: 50,
		});

        this.eventEmitter.subscriptions
            .on('added', (event, peerId, metaData) => {
                logger.debug(`Peer ${peerId} subscribed to ${event} with metadata: %o`, metaData);
                this._stateLogs.push(`Peer ${peerId} subscribed to ${event} with metadata: ${JSON.stringify(metaData)}`);
            })
            .on('removed', (event, peerId) => {
                logger.debug(`Peer ${peerId} unsubscribed from ${event}`);
                this._stateLogs.push(`Peer ${peerId} unsubscribed from ${event}`);
            })
            ;

        (this.eventEmitter.subscriptions as any).on('debug', (message: string) => {
            logger.debug(message);
            this._stateLogs.push(message);
        });
        
        await this.eventEmitter.subscribe('client-sample', (message) => {
            this.emit('client-sample', message);
        });

        await this.eventEmitter.subscribe('create-pipe-transport-request', (requestId, payload) => {
            this.emit('create-pipe-transport-request', payload, createNonVoidResponseCallback(requestId));
        });

        await this.eventEmitter.subscribe('connect-pipe-transport-request', (requestId, payload) => {
            this.emit('connect-pipe-transport-request', payload, createVoidResponseCallback(requestId));
        });

        await this.eventEmitter.subscribe('pipe-media-producer-to', (requestId, payload) => {
            this.emit('pipe-media-producer-to', payload, createNonVoidResponseCallback(requestId));
        });

        await this.eventEmitter.subscribe('consume-media-producer', (payload) => {
            this.emit('consume-media-producer', payload);
        });

        await this.eventEmitter.subscribe('piped-media-consumer-closed', (payload) => {
            this.emit('piped-media-consumer-closed', payload);
        });

        await this.eventEmitter.subscribe('get-client-producers-request', (requestId, payload) => {
            this.emit('get-client-producers-request', payload, createNonVoidResponseCallback(requestId));
        });

        await this.eventEmitter.subscribe('get-all-call-stats-request', (requestId, payload) => {
            this.emit('get-all-call-stats-request', payload, createNonVoidResponseCallback(requestId));
        });

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
        this._stateLogs.push('Subscribed to all events');
    

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

    private _createBroadcastPendingRequest<T>(debugInfo: Record<string, unknown>): [requestId: string, promise: Promise<T[]>] {
        const requestId = uuid();
        const replies: T[] = [];
        const peerIds = new Set<string>(
            [...this.hamok.remotePeerIds, this.hamok.localPeerId].filter(peerId => !peerId.includes('dev-'))
        );
        return [
            requestId,
            new Promise((_resolve, _reject) => {
                const timer = setTimeout(() => {
                    this._pendingRequests.delete(requestId);
                    _reject('Request timed out. debugInfo: ' + JSON.stringify(debugInfo));
                }, 5000);

                this._pendingRequests.set(requestId, { 
                    resolve: data => {
                        replies.push(data);
                        if (peerIds.size === replies.length) {
                            this._pendingRequests.delete(requestId);
                            _resolve(replies);
                        }
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

        this._redisState = 'connecting';

		redisPublisher.on('reconnecting', () => logger.warn('Reconnecting'));
		redisPublisher.on('ready', () => logger.info('Ready'));
		redisPublisher.on('end', () => (logger.warn('Connection closed (ended)'), this._redisState = 'disconnected'));
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

            this._redisState = 'error';
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

            this._redisState = 'connected';
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
        this._stateLogs.push(`Remote peer joined: ${peerId}`);
	}

	private _remotePeerLeft(peerId: string) {
		logger.info('Remote peer left: %s', peerId);
        this._stateLogs.push(`Remote peer left: ${peerId}`);
		
		if (this.hamok.leader) {
            // if this node is the leader and another peer left, maybe we need to do something with some stuffs?
		}
	}

	private async _leaderChanged(leaderId: string | undefined) {
        this._stateLogs.push(`Leader changed to: ${leaderId}`);
		if (leaderId !== this.hamok.localPeerId) {
			return;
		}
        // if this node is the leader, we need to do something with some stuffs?
	}

}
