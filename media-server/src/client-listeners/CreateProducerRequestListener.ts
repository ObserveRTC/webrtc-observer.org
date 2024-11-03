import { ClientContext } from "../common/ClientContext";
import { createLogger } from "../common/logger";
import { ConsumerCreatedNotification, CreateProducerResponsePayload, Response } from "../protocols/MessageProtocol";
import { HamokService } from "../services/HamokService";
import { MediasoupService } from "../services/MediasoupService"
import { ClientMessageContext } from "./ClientMessageListener";
import * as mediasoup from 'mediasoup';

const logger = createLogger('CreateProducerRequestListener');

export type CreateProducerRequestListenerContext = {
	mediasoupService: MediasoupService,
	hamokService: HamokService,
	maxProducerPerClients: number,
}

export function createCreateProducerRequestListener(listenerContext: CreateProducerRequestListenerContext) {
	const { 
		hamokService,
	} = listenerContext;

	const result = async (messageContext: ClientMessageContext) => {
		const { 
			message: request,
			client,
		} = messageContext;

		if (request.type !== 'create-producer-request') {
			return logger.warn(`Invalid message type ${request.type}`);
		}else if (!client.routerId) {
			return logger.warn(`Client ${client.clientId} routerId not found`);
		} else if (client.sndTransport === undefined) {
			return logger.warn(`Client ${client.clientId} has no sending transport`);
		} else if (client.mediaProducers.size >= listenerContext.maxProducerPerClients) {
			return messageContext.send(new Response(
				request.requestId,
				undefined,
				`Max producers per client reached`
			));
		}

		let mediaProducer: mediasoup.types.Producer | undefined;
		let response: CreateProducerResponsePayload | undefined;
		let error: string | undefined;
		try {
			const newproducer = await client.sndTransport.produce({
				kind: request.kind,
				rtpParameters: request.rtpParameters,
			});

			newproducer.observer.once('close', () => {
				client.mediaProducers.delete(newproducer.id);
			});
			client.mediaProducers.add(newproducer.id);

			response = {
				producerId: newproducer.id,
			};

			mediaProducer = newproducer;
		} catch (err) {
			error = `${err}`;
		}
		
		messageContext.send(new Response(
			request.requestId,
			response,
			error
		));

		if (mediaProducer) {
			// setInterval(async () => {
			// 	const stats = await mediaProducer.getStats();
			// 	console.log('Producer stats', stats);
			// }, 5000);
			try {
				for (const [consumingClientId, consumingClient] of hamokService.clients.entries()) {
					if (consumingClientId === client.clientId) continue;
					if (consumingClient.roomId !== client.roomId) continue;
					if (consumingClient.callId !== client.callId) continue;
					if (!consumingClient.routerId) continue;

					hamokService.consumeMediaProducer({
						consumingClientId: consumingClient.clientId,
						producingClientId: client.clientId,
						producingUserId: client.userId,
						mediaProducerId: mediaProducer.id,
						producingRouterId: client.routerId,
					});
				}
			} catch (err) {
				logger.error(`Error occurred while trying to consume media producer ${mediaProducer.id}`, err);
			}
		}

	};
	return result;
}