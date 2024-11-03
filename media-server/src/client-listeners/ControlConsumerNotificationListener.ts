import { ClientContext } from "../common/ClientContext";
import { createLogger } from "../common/logger";
import { MediasoupService } from "../services/MediasoupService"
import { ClientMessageContext, ClientMessageListener } from "./ClientMessageListener"

const logger = createLogger('ControlConsumerNotificationListener');

export type ControlConsumerNotificationListenerContext = {
	mediasoupService: MediasoupService,
}

export function createControlConsumerNotificationListener(listenerContext: ControlConsumerNotificationListenerContext): ClientMessageListener {
	const { 
		mediasoupService,
	} = listenerContext;

	const result = async (messageContext: ClientMessageContext) => {
		const { 
			message: request,
			client,
		} = messageContext;

		if (request.type !== 'control-consumer-notification') {
			return logger.warn(`Invalid message type ${request.type}`);
		} else if (!client?.mediaConsumers.has(request.consumerId)) {
			return logger.warn(`Consumer ${request.consumerId} not found for client ${client.clientId}`);
		}
		
		const consumer = mediasoupService.mediaConsumers.get(request.consumerId);
		if (!consumer) {
			return logger.warn(`Consumer ${request.consumerId} not found`);
		}

		logger.debug(`Client ${client.clientId} controlling consumer ${consumer.id}. request: %o`, request);

		try {
			switch (request.action) {
				case 'pause':
					await consumer.pause();
					break
				case 'resume':
					await consumer.resume();
					break;
				case 'close':
					consumer.appData.remoteClosed = true;
					consumer.close();
					break;
			}
		} catch (err) {
			logger.warn(`Error occurred while trying to control consumer %o`, err);
		}
	};
	return result;
}
