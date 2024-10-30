import * as mediasoup from 'mediasoup';
import { createLogger } from '../common/logger';
import { ClientContext } from '../common/ClientContext';
import { ControlConsumerNotification } from '../protocols/MessageProtocol';

const logger = createLogger('MediasoupService');

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
}	

type ConsumerAppData = {
	remoteClosed?: boolean;
}

import dns from 'dns';
import os from 'os';

export class MediasoupService {
	private _run = false;
	public readonly workers = new Map<number, mediasoup.types.Worker<WorkerAppData>>();
	public readonly routers = new Map<string, mediasoup.types.Router<RouterAppData>>();
	public readonly transports = new Map<string, mediasoup.types.Transport>();
	public readonly mediaProducers = new Map<string, mediasoup.types.Producer<ProducerAppData>>();
	public readonly mediaConsumers = new Map<string, mediasoup.types.Consumer<ConsumerAppData>>();
	public readonly dataProducers = new Map<string, mediasoup.types.DataProducer>();
	public readonly dataConsumers = new Map<string, mediasoup.types.DataConsumer>();
	private _announcedAddress?: string;

	public constructor(
		public readonly config: MediasoupServiceConfig
	) {

	}
	
	public async start() {
		if (this._run) return;
		this._run = true;
		const webrtcServerListeningPorts = new Set<number>();
		const address = await dns.promises.lookup(os.hostname());
		
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

	public async getOrCreateRouter(routerId?: string): Promise<mediasoup.types.Router<RouterAppData>> {		
		if (!this.workers) throw new Error('Worker is not started');
		
		let router = this.routers.get(routerId || '');
		
		if (router) return router;

		const worker = [...this.workers.values()][Math.floor(Math.random() * this.workers.size)];
		const newrouter = await worker.createRouter<RouterAppData>({
			mediaCodecs: this.config.mediaCodecs,
			appData: {
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

	public async consumeMediaProducer(producerId: string, consumingClient: ClientContext): Promise<mediasoup.types.Consumer> {
		const mediaProducer = this.mediaProducers.get(producerId);
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
			consumingClient.mediaConsumers.delete(consumer.id);

			if (!consumer.appData.remoteClosed) {
				consumingClient.send(new ControlConsumerNotification(
					consumer.id,
					'close',
				));
			}
		});
		mediaProducer.observer.on('pause', onProducerPause);
		mediaProducer.observer.on('resume', onProducerResume);
		consumingClient.mediaConsumers.add(consumer.id);

		return consumer;
	};

	private _addTransport = (router: mediasoup.types.Router<RouterAppData>, transport: mediasoup.types.Transport) => {
		
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

	
}