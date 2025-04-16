import { MediaConsumer, MediaProducer } from "@l7mp/cloud-sfu-client"
import { ClientContext } from "./ClientContext";
import { ConsumerCreatedNotification, ControlConsumerNotification } from "../protocols/MessageProtocol";
import { createLogger } from "./logger";

const logger = createLogger('CreatedConsumerHandler');

export type HandlerCreatedConsumerOptions = {
	mediaConsumer: MediaConsumer,
	mediaProducer: MediaProducer,
}

export function handleCreatedMediaConsumer(options: HandlerCreatedConsumerOptions) {
	const {
		mediaConsumer,
		mediaProducer,
	} = options;

	const producingClient = mediaProducer.appData.client as ClientContext;
	const consumingClient = mediaConsumer.appData.client as ClientContext;

	if (!producingClient || !consumingClient) {
		throw new Error('Client not found');
	}

	const producingClientId = producingClient.clientId;
	const producingUserId = producingClient.userId;
	const mediaProducerId = mediaProducer.id;

	const pauseListener = () => {
		consumingClient.send(new ControlConsumerNotification(
			mediaConsumer.id,
			"pause"
		))
	}

	const resumeListener = () => {
		consumingClient.send(new ControlConsumerNotification(
			mediaConsumer.id,
			"resume"
		))
	}

	mediaConsumer.observer.once('close', () => {
		mediaConsumer.observer.off('pause', pauseListener);
		mediaConsumer.observer.off('resume', resumeListener);

		consumingClient.send(new ControlConsumerNotification(
			mediaConsumer.id,
			"close"
		))
	})
	mediaConsumer.observer.on('pause', pauseListener);
	mediaConsumer.observer.on('resume', resumeListener);

	consumingClient.send(new ConsumerCreatedNotification(
		mediaConsumer.id,
		mediaProducerId,
		mediaConsumer.kind,
		mediaConsumer.rtpParameters,
		{
			producerId: mediaProducer.id,
			paused: mediaProducer.paused,
		},
		{
			clientId: producingClientId,
			userId: producingUserId ?? 'unknown',
		}
	));

	logger.debug(`Created consumer ${mediaConsumer.id} consuming media producer ${mediaProducerId} for client ${consumingClient.clientId} (${consumingClient.userId}). kind: ${mediaConsumer.kind}, paused: ${mediaConsumer.paused}`);
}