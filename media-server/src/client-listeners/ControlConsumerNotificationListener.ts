import { CloudSfu } from "@l7mp/cloud-sfu-client";
import { createLogger } from "../common/logger";
import { ClientMessageContext, ClientMessageListener } from "./ClientMessageListener"

const logger = createLogger('ControlConsumerNotificationListener');

export type ControlConsumerNotificationListenerContext = {
	// mediasoupService: MediasoupService,
	cloudSfu: CloudSfu,
}

export function createControlConsumerNotificationListener(listenerContext: ControlConsumerNotificationListenerContext): ClientMessageListener {
	const { 
		cloudSfu,
	} = listenerContext;

	const result = async (messageContext: ClientMessageContext) => {
		const { 
			message: request,
			client,
		} = messageContext;

		if (request.type !== 'control-consumer-notification') {
			return logger.warn(`Invalid message type ${request.type}`);
		}

		const router = cloudSfu.routers.get(client.routerId ?? '');

		if (!router) return logger.warn(`Router ${client.routerId} not found`);
		
		const consumer = router.mediaConsumers.get(request.consumerId);
		if (!consumer) {
			return logger.warn(`Consumer ${request.consumerId} not found for router %s, %s`, client.routerId, [...router.mediaConsumers.keys()]);
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
