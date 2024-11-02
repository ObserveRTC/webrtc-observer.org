import { createLogger } from "../common/logger";
import { ConsumerCreatedNotification } from "../protocols/MessageProtocol";
import { Server } from "../Server";
import { HamokServiceEventMap } from "../services/HamokService";
import { MediasoupService } from "../services/MediasoupService";
import mediasoup from 'mediasoup';

const logger = createLogger('ConsumeMediaProducerListener');

export type ConsumeMediaProducerListenerContext = {
	mediasoupService: MediasoupService,
	server: Server,
}

export function createConsumeMediaProducerListener(listenerContext: ConsumeMediaProducerListenerContext) {
	const { 
		mediasoupService,
		server,
	} = listenerContext;

	const result = async (...options: HamokServiceEventMap['consume-media-producer']) => {
		const [{ 
			producingClientId,
			producingUserId,
			producingRouterId,
			mediaProducerId,
			consumingClientId,
		}] = options;

		const consumingClient = server.clients.get(consumingClientId);

		if (!consumingClient || !consumingClient.routerId) return;

		logger.debug(`Client ${consumingClient.clientId} (${consumingClient.userId}) consuming media producer ${mediaProducerId} from client ${producingClientId} (${producingUserId}).  consumingRouterId: ${consumingClient.routerId}, producingRouter: ${producingRouterId}`);

		try {
			let mediaProducer: mediasoup.types.Producer | undefined;

			if (producingRouterId !== consumingClient.routerId) {
				logger.debug(`Piping media producer ${mediaProducerId} from router ${producingRouterId} to router ${consumingClient.routerId}`);

				mediaProducer = await mediasoupService.getOrCreatePipedMediaProducer({
					localRouterId: consumingClient.routerId,
					mediaProducerId,
					remoteRouterId: producingRouterId,
				});
			} else {
				mediaProducer = mediasoupService.mediaProducers.get(mediaProducerId);
			}


			if (!mediaProducer) {
				return logger.warn(`Media producer ${mediaProducerId} not found in mediasoupService`);
			}

			const consumer = await mediasoupService.consumeMediaProducer(mediaProducerId, consumingClient);

			for (const existingConsumerId of consumingClient.mediaConsumers) {
				const existingConsumer = mediasoupService.mediaConsumers.get(existingConsumerId);
	
				if (existingConsumer?.producerId === mediaProducerId) {
					logger.warn(`Consumer ${existingConsumerId} already consuming media producer ${mediaProducerId} for client ${consumingClientId}. Closing newly created consumer ${consumer.id}`);
					return consumer.close();
				}
			}

			logger.debug(`Created consumer ${consumer.id} consuming media producer ${mediaProducerId} for client ${consumingClientId} (${consumingClient.userId}). kind: ${consumer.kind}, paused: ${consumer.paused}`);
			
			consumer.observer.once('close', () => {
				consumingClient.mediaConsumers.delete(consumer.id);
			})
			consumingClient.mediaConsumers.add(consumer.id);

			consumingClient.send(new ConsumerCreatedNotification(
				consumer.id,
				mediaProducerId,
				consumer.kind,
				consumer.rtpParameters,
				{
					producerId: mediaProducer.id,
					paused: mediaProducer.paused,
				},
				{
					clientId: producingClientId,
					userId: producingUserId ?? 'unknown',
				}
			))

		} catch (err) {
			logger.warn(`Failed to create pipe transport: ${err}`);
		}
		
		
	};

	return result;
}