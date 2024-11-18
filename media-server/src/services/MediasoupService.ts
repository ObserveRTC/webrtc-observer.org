import * as mediasoup from 'mediasoup';
import { createLogger } from '../common/logger';
import { ClientContext } from '../common/ClientContext';
import { ControlConsumerNotification } from '../protocols/MessageProtocol';
import dns from 'dns';
import os from 'os';
import { cmpUuids } from '../common/utils';
import { WebRtcTransport } from 'mediasoup/node/lib/types';
import { EventEmitter } from 'stream';

const logger = createLogger('MediasoupService');

export type MediasoupServiceEventMap = {
	'new-webrtc-media-consumer': [ consumer: mediasoup.types.Consumer ],
}

export type MediasoupServiceConfig = {
	numberOfWorkers: number;
	workerSettings: mediasoup.types.WorkerSettings;
	webRtcServerSettings: mediasoup.types.WebRtcServerOptions[];
	mediaCodecs: mediasoup.types.RtpCodecCapability[];
}

type WorkerAppData = {
	webRtcServer?: mediasoup.types.WebRtcServer<{ port: number }>;
}

export type RouterAppData = {
	callId: string;
	workerPid: number;
	mediaProducers: Map<string, mediasoup.types.Producer<ProducerAppData>>;
	mediaConsumers: Map<string, mediasoup.types.Consumer<ConsumerAppData>>;
	dataProducers: Map<string, mediasoup.types.DataProducer>;
	dataConsumers: Map<string, mediasoup.types.DataConsumer>;
	transports: Map<string, mediasoup.types.Transport>;
}

type ProducerAppData = {
	routerId: string;
	transportId: string;
	remoteClosed?: boolean;
	piped?: boolean;
}	

type ConsumerAppData = {
	remoteClosed?: boolean;
}

export type PipeTransportAppData = {
	remoteRouterId: string;
	connecting?: Promise<void>;
	connected: boolean;
}

type PipedMediaProducerAppData = {
	srcRouterId: string;
	routerId: string;
}

type PipedMediaConsumerAppData = {
	srcRouterId: string;
	dstRouterId: string;
}

export class MediasoupService extends EventEmitter<MediasoupServiceEventMap> {
	private _run = false;
	public readonly workers = new Map<number, mediasoup.types.Worker<WorkerAppData>>();
	public readonly routers = new Map<string, mediasoup.types.Router<RouterAppData>>();
	public readonly transports = new Map<string, mediasoup.types.Transport>();
	public readonly mediaProducers = new Map<string, mediasoup.types.Producer<ProducerAppData>>();
	public readonly mediaConsumers = new Map<string, mediasoup.types.Consumer<ConsumerAppData>>();
	public readonly dataProducers = new Map<string, mediasoup.types.DataProducer>();
	public readonly dataConsumers = new Map<string, mediasoup.types.DataConsumer>();

	private readonly _pipedMediaProducer = new Map<string, Promise<mediasoup.types.Producer<PipedMediaProducerAppData>>>();
	private readonly _pipedMediaConsumer = new Map<string, mediasoup.types.Consumer<PipedMediaConsumerAppData>>();
	private readonly _pipes = new Map<string, Promise<mediasoup.types.PipeTransport<PipeTransportAppData>>>();

	private _announcedAddress?: string;

	public constructor(
		public readonly config: MediasoupServiceConfig
	) {
		super();
	}

	public createRemotePipeTransport?: (options: { srcRouterId: string, dstRouterId: string }) => Promise<{ ip: string, port: number }>;
	public connectRemotePipeTransport?: (options: { srcRouterId: string, dstRouterId: string, ip: string, port: number }) => Promise<void>;
	public pipeRemoteMediaProducerTo?: (options: { mediaProducerId: string, srcRouterId: string, dstRouterId: string }) => Promise<mediasoup.types.ProducerOptions>;
	
	public async start() {
		if (this._run) return;
		this._run = true;
		const webrtcServerListeningPorts = new Set<number>();

		logger.info('os.hostname(): %o', os.hostname());

		const address = await dns.promises.lookup(os.hostname()).catch(err => (logger.error('Error occurred while trying to get hostname', err), { address: undefined }));
		
		this._announcedAddress = address.address;

		logger.info(`Announced address: ${this._announcedAddress}`);

		for (let i = 0; i < this.config.numberOfWorkers; i++) {
			const worker = await mediasoup.createWorker<WorkerAppData>({
				...this.config.workerSettings,
				appData: {
					webRtcServer: undefined,
				},
			});
			const webrtcServerOptions = this.config.webRtcServerSettings?.[i];

			if (webrtcServerOptions) {
				if (webrtcServerOptions.listenInfos.length < 1) throw new Error('No listenInfos provided for webrtc server');
				let port: number | undefined = undefined;

				for (const info of webrtcServerOptions.listenInfos) {
					if (!info.port) throw new Error('Port is not provided for webrtc server');
					if (port === undefined) port = info.port;
					else if (port !== info.port) throw new Error('Port must be the same for all listenInfos for one webrtc server');
				}
				if (!port) throw new Error('Port is not provided for webrtc server');
				else if (webrtcServerListeningPorts.has(port)) throw new Error(`Port ${port} is already used by another webrtc server`);

				if (this._announcedAddress) {
					for (const info of webrtcServerOptions.listenInfos) {
						info.announcedAddress = this._announcedAddress;
					}
				}

				worker.appData.webRtcServer = await worker.createWebRtcServer({
					...webrtcServerOptions,
					appData: {
						port,
					}
				});

				logger.info(`Worker ${worker.pid} created with webrtc server on port ${port} webrtc server options: %o`, webrtcServerOptions);
			}
			
			worker.once('died', () => {
				this.workers.delete(worker.pid);
				logger.error(`Worker ${worker.pid} died`);
			});
			this.workers.set(worker.pid, worker);	

			logger.info(`Worker ${worker.pid} created`);
		}
	}

	public async stop() {
		if (!this._run) return;
		this._run = false;

		for (const worker of this.workers.values()) {
			worker.close();
		}
	}

	public get announcedAddress() {
		return this._announcedAddress ?? '127.0.0.1';
	}

	public closePipedMediaProducer(mediaProducerId: string) {
		this._pipedMediaProducer.get(mediaProducerId)?.then(producer => producer.close());
	}

	public async createRouter(callId: string): Promise<mediasoup.types.Router<RouterAppData>> {		
		if (!this.workers) throw new Error('Worker is not started');
		
		const worker = [...this.workers.values()][Math.floor(Math.random() * this.workers.size)];
		const newrouter = await worker.createRouter<RouterAppData>({
			mediaCodecs: this.config.mediaCodecs,
			appData: {
				callId,
				workerPid: worker.pid,
				dataConsumers: new Map(),
				dataProducers: new Map(),
				mediaConsumers: new Map(),
				mediaProducers: new Map(),
				transports: new Map(),
			}
		});

		const addTransport = (transport: mediasoup.types.Transport) => this._addTransport(newrouter, transport);

		newrouter.observer.once('close', () => {
			newrouter.observer.off('newtransport', addTransport);
			this.routers.delete(newrouter.id);

			logger.info(`Router ${newrouter.id} closed`);
		})
		newrouter.observer.on('newtransport', addTransport);
		this.routers.set(newrouter.id, newrouter);

		logger.info(`Router ${newrouter.id} created`);
		return newrouter;
	}

	public async getOrCreatePipedMediaProducer(options: { mediaProducerId: string, localRouterId: string, remoteRouterId: string }): Promise<mediasoup.types.Producer> {
		const existingMediaProducer = this._pipedMediaProducer.get(options.mediaProducerId);
		const localRouter = this.routers.get(options.localRouterId);

		if (existingMediaProducer) return existingMediaProducer;
		else if (!localRouter) throw new Error(`Router ${options.localRouterId} not found`);
		
		const pipedMediaProducer = (async () => {
			if (!this.pipeRemoteMediaProducerTo) throw new Error('consumeRemoteProducer is not set');
			
			const localPipeTransport = await this._pipeToRemoteRouter({ localRouterId: options.localRouterId, remoteRouterId: options.remoteRouterId });
			const producerOptions = await this.pipeRemoteMediaProducerTo({
				dstRouterId: options.localRouterId,
				srcRouterId: options.remoteRouterId,
				mediaProducerId: options.mediaProducerId,
			});
			const mediaProducer = await localPipeTransport.produce<PipedMediaProducerAppData>({
				...producerOptions,
				appData: {
					srcRouterId: options.remoteRouterId,
					routerId: options.localRouterId,
				}
			});

			logger.debug(`Piped media producer ${mediaProducer.id} is created from router ${options.remoteRouterId} to router ${options.localRouterId}. kind: ${mediaProducer.kind}, paused: ${mediaProducer.paused}`);

			mediaProducer.observer.once('close', () => {
				this._pipedMediaProducer.delete(options.mediaProducerId);

				logger.debug(`Piped media producer ${mediaProducer.id} closed`);
			});

			return mediaProducer;
		})();

		this._pipedMediaProducer.set(options.mediaProducerId, pipedMediaProducer);

		logger.debug(`Piped media producer ${options.mediaProducerId} is creating from router ${options.remoteRouterId} to router ${options.localRouterId}`);
		
		return pipedMediaProducer;
	}

	public async getOrCreatePipedMediaConsumer(options: { srcRouterId: string, dstRouterId: string, mediaProducerId: string }): Promise<mediasoup.types.Consumer<PipedMediaConsumerAppData>> {
		let existingMediaConsumer = this._findExistingPipedMediaConsumer(options.srcRouterId, options.dstRouterId, options.mediaProducerId);
		const srcRouter = this.routers.get(options.srcRouterId);

		if (existingMediaConsumer) return existingMediaConsumer;
		else if (!srcRouter) throw new Error(`Router ${options.srcRouterId} not found`);

		const pipeTransport = await this.getOrCreatePipeTransport(options.srcRouterId, options.dstRouterId);

		if (!pipeTransport) throw new Error(`Pipe transport from ${options.srcRouterId} to ${options.dstRouterId} not found`);

		await pipeTransport.appData.connecting;

		const mediaProducer = this.mediaProducers.get(options.mediaProducerId);
		if (!mediaProducer) throw new Error(`Media producer ${options.mediaProducerId} not found`);

		const consumer = await pipeTransport.consume<PipedMediaConsumerAppData>({
			producerId: mediaProducer.id,
			appData: {
				dstRouterId: options.dstRouterId,
				srcRouterId: options.srcRouterId,
			}
		});

		existingMediaConsumer = this._findExistingPipedMediaConsumer(options.srcRouterId, options.dstRouterId, options.mediaProducerId);

		if (existingMediaConsumer) {
			logger.warn(`Piped media consumer ${existingMediaConsumer.id} already created for media producer ${options.mediaProducerId} meanwhile creating new one`);
			consumer.close();

			return existingMediaConsumer;
		}

		consumer.observer.once('close', () => {
			this._pipedMediaConsumer.delete(options.mediaProducerId);

			logger.debug(`Piped media consumer ${consumer.id} closed for media producer ${options.mediaProducerId}`);
		});
		this._pipedMediaConsumer.set(options.mediaProducerId, consumer);

		logger.debug(`Piped media consumer ${consumer.id} created for media producer ${options.mediaProducerId} from router ${options.srcRouterId} to router ${options.dstRouterId}. kind: ${consumer.kind}, paused: ${consumer.paused}`);

		return consumer;
	}

	public getOrCreatePipeTransport(srcRouterId: string, dstRouterId: string): Promise<mediasoup.types.PipeTransport<PipeTransportAppData>> {
		const srcRouter = this.routers.get(srcRouterId);
		const existingPipe = this._pipes.get(dstRouterId);

		if (!srcRouter) {
			throw new Error(`Router ${srcRouterId} or ${dstRouterId} not found`);
		} else if (existingPipe) {
			return existingPipe;
		}

		const pipeTransport = (async () => {
			try {
				const result = await srcRouter.createPipeTransport<PipeTransportAppData>({
					listenInfo: {
						ip: this._announcedAddress ?? '127.0.0.1',
						protocol: 'udp',
					},
					appData: {
						remoteRouterId: dstRouterId,
						connecting: undefined,
						connected: false,
					}
				});

				result.observer.once('close', () => {
					this._pipes.delete(dstRouterId);
				});

				logger.debug(`Pipe transport created. srcRouterId: ${srcRouterId}, dstRouter: ${dstRouterId}, listenInfo: %o`, result.tuple);

				return result;
			} catch (err) {
				logger.error(`Error occurred while creating pipe transport`, err);
				this._pipes.delete(dstRouterId);
				throw err;
			}
			
		})();

		this._pipes.set(dstRouterId, pipeTransport);

		return pipeTransport;
	}

	public async consumeMediaProducer(producerId: string, consumingClient: ClientContext): Promise<mediasoup.types.Consumer> {
		const mediaProducer = this.mediaProducers.get(producerId) ?? (await this._pipedMediaProducer.get(producerId));
		logger.info(`Attempt to consume media producer ${mediaProducer?.id} to client ${consumingClient.clientId}`);

		if (!mediaProducer || !consumingClient) {
			throw new Error(`Media producer ${producerId} or consuming client ${consumingClient.clientId} not found`);
		} else if (consumingClient.rcvTransport === undefined) {
			throw new Error(`Client ${consumingClient.clientId} has no receiving transport`);
		}
		

		const router = this.routers.get(mediaProducer.appData.routerId);
		if (!router) {
			throw new Error(`Router ${mediaProducer.appData.routerId} not found`);
		}

		const consumer = await consumingClient.rcvTransport.consume<ConsumerAppData>({
			producerId: mediaProducer.id,
			rtpCapabilities: router.rtpCapabilities,
			paused: mediaProducer.kind === 'video',
			appData: {
				remoteClosed: false,
			}
		});
		const onProducerPause = () => consumingClient.send(new ControlConsumerNotification(
			consumer.id,
			'producerPaused',
		));
		const onProducerResume = () => consumingClient.send(new ControlConsumerNotification(
			consumer.id,
			'producerResume',
		));

		consumer.observer.once('close', () => {
			mediaProducer.observer.off('pause', onProducerPause);
			mediaProducer.observer.off('resume', onProducerResume);

			if (!consumer.appData.remoteClosed) {
				consumingClient.send(new ControlConsumerNotification(
					consumer.id,
					'close',
				));
			}
		});
		mediaProducer.observer.on('pause', onProducerPause);
		mediaProducer.observer.on('resume', onProducerResume);

		return consumer;
	};

	private async _pipeToRemoteRouter(options: { remoteRouterId: string, localRouterId: string }): Promise<mediasoup.types.PipeTransport<PipeTransportAppData>> {
		
		if (!this.createRemotePipeTransport) throw new Error('createRemotePipeTransport is not set');
		else if (!this.connectRemotePipeTransport) throw new Error('connectRemotePipeTransport is not set');

		const localPipeTransport = await this.getOrCreatePipeTransport(options.localRouterId, options.remoteRouterId);

		if (localPipeTransport.appData.connecting) {
			await localPipeTransport.appData.connecting;

			return localPipeTransport;
		}

		logger.debug(`Connecting pipe transports from ${options.localRouterId} to ${options.remoteRouterId}`);

		const { ip: remoteIp, port: remotePort } = await this.createRemotePipeTransport({
			srcRouterId: options.remoteRouterId,
			dstRouterId: options.localRouterId,
		});

		logger.debug(`Remote Pipe transport from ${options.remoteRouterId} is created. Address: ${remoteIp}:${remotePort}. is local pipe transport connecting? ${localPipeTransport.appData.connecting !== undefined}`);

		if (localPipeTransport.appData.connecting) {
			await localPipeTransport.appData.connecting;

			return localPipeTransport;
		}

		localPipeTransport.appData.connecting = Promise.all([
			localPipeTransport.connect({ ip: remoteIp, port: remotePort }),
			this.connectRemotePipeTransport({
				srcRouterId: options.remoteRouterId,
				dstRouterId: options.localRouterId,
				ip: localPipeTransport.tuple.localIp,
				port: localPipeTransport.tuple.localPort,
			})
		]).then(() => void 0)

		await localPipeTransport.appData.connecting;
		localPipeTransport.appData.connected = true;

		logger.debug(`Pipe transports are connected between ${options.localRouterId} to ${options.remoteRouterId}`);

		return localPipeTransport;
	}

	private _addTransport = (router: mediasoup.types.Router<RouterAppData>, transport: mediasoup.types.Transport) => {
		if (transport.constructor.name !== 'WebRtcTransport') {
			// at the moment we only add webrtc transport
			return;
		}

		const addProducer = (producer: mediasoup.types.Producer) => this._addProducer(router, transport, producer);
		const addConsumer = (consumer: mediasoup.types.Consumer) => this._addConsumer(router, transport, consumer);
		const addDataProducer = (dataProducer: mediasoup.types.DataProducer) => this._addDataProducer(router, transport, dataProducer);
		const addDataConsumer = (dataConsumer: mediasoup.types.DataConsumer) => this._addDataConsumer(router, transport, dataConsumer);

		transport.observer.once('close', () => {
			transport.observer.off('newproducer', addProducer);
			transport.observer.off('newconsumer', addConsumer);
			transport.observer.off('newdataproducer', addDataProducer);
			transport.observer.off('newdataconsumer', addDataConsumer);

			router.appData.transports.delete(transport.id);
			this.transports.delete(transport.id);

			logger.info(`Transport ${transport.id} closed on router ${router.id}. the number of transports is ${this.transports.size}`);

			if (this.transports.size === 0) {
				router.close();
			}
		});

		transport.observer.on('newproducer', addProducer);
		transport.observer.on('newconsumer', addConsumer);
		transport.observer.on('newdataproducer', addDataProducer);
		transport.observer.on('newdataconsumer', addDataConsumer);

		router.appData.transports.set(transport.id, transport);
		this.transports.set(transport.id, transport);

		logger.info(`Transport ${transport.id} created on router ${router.id}`);
	}

	private _addProducer = (router: mediasoup.types.Router<RouterAppData>, transport: mediasoup.types.Transport, producer: mediasoup.types.Producer) => {
		producer.observer.once('close', () => {
			router.appData.mediaProducers.delete(producer.id);
			this.mediaProducers.delete(producer.id);

			logger.info(`Producer ${producer.id} closed on transport ${transport.id} on router ${router.id}`);
		});

		producer.appData.routerId = router.id;
		producer.appData.transportId = transport.id;
		producer.appData.remoteClosed = false;

		router.appData.mediaProducers.set(producer.id, producer as mediasoup.types.Producer<ProducerAppData>);
		this.mediaProducers.set(producer.id, producer as mediasoup.types.Producer<ProducerAppData>);

		logger.info(`Producer ${producer.id} created on transport ${transport.id} on router ${router.id}`);
	}

	private _addConsumer = (router: mediasoup.types.Router<RouterAppData>, transport: mediasoup.types.Transport, consumer: mediasoup.types.Consumer) => {
		consumer.observer.once('close', () => {
			router.appData.mediaConsumers.delete(consumer.id);
			this.mediaConsumers.delete(consumer.id);

			logger.info(`Consumer ${consumer.id} closed on transport ${transport.id} on router ${router.id}`);
		});
		router.appData.mediaConsumers.set(consumer.id, consumer);
		this.mediaConsumers.set(consumer.id, consumer);

		if (transport.constructor.name === 'WebRtcTransport') {
			this.emit('new-webrtc-media-consumer', consumer);
		}
		logger.info(`Consumer ${consumer.id} created on transport ${transport.id} on router ${router.id}`);
	}

	private _addDataProducer = (router: mediasoup.types.Router<RouterAppData>, transport: mediasoup.types.Transport, dataProducer: mediasoup.types.DataProducer) => {
		dataProducer.observer.once('close', () => {
			router.appData.dataProducers.delete(dataProducer.id);
			this.dataProducers.delete(dataProducer.id);

			logger.info(`Data producer ${dataProducer.id} closed on transport ${transport.id} on router ${router.id}`);
		});
		router.appData.dataProducers.set(dataProducer.id, dataProducer);
		this.dataProducers.set(dataProducer.id, dataProducer);

		logger.info(`Data producer ${dataProducer.id} created on transport ${transport.id} on router ${router.id}`);
	}

	private _addDataConsumer = (router: mediasoup.types.Router<RouterAppData>, transport: mediasoup.types.Transport, dataConsumer: mediasoup.types.DataConsumer) => {
		dataConsumer.observer.once('close', () => {
			router.appData.dataConsumers.delete(dataConsumer.id);
			this.dataConsumers.delete(dataConsumer.id);

			logger.info(`Data consumer ${dataConsumer.id} closed on transport ${transport.id} on router ${router.id}`);
		});
		router.appData.dataConsumers.set(dataConsumer.id, dataConsumer);
		this.dataConsumers.set(dataConsumer.id, dataConsumer);

		logger.info(`Data consumer ${dataConsumer.id} created on transport ${transport.id} on router ${router.id}`);
	}
	
	private _findExistingPipedMediaConsumer(srcRouterId: string, dstRouterId: string, mediaProducerId: string): mediasoup.types.Consumer<PipedMediaConsumerAppData> | undefined {
		return [ ...this._pipedMediaConsumer.values() ].find(consumer => consumer.appData.srcRouterId === srcRouterId && consumer.appData.dstRouterId === dstRouterId && consumer.producerId === mediaProducerId);
	}
}