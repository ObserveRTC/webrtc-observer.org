import { CloudSfu } from "@l7mp/cloud-sfu-client";
import { ClientContext } from "../common/ClientContext";
import { createLogger } from "../common/logger";
import { MediasoupService } from "../services/MediasoupService"
import { ClientMessageContext, ClientMessageListener } from "./ClientMessageListener"

const logger = createLogger('ControlProducerNotificationListener');

export type ControlProducerNotificationListenerContext = {
	// mediasoupService: MediasoupService,
	cloudSfu: CloudSfu,
}

export function createControlProducerNotificationListener(listenerContext: ControlProducerNotificationListenerContext): ClientMessageListener {
	const { 
		cloudSfu,
	} = listenerContext;

	const result = async (messageContext: ClientMessageContext) => {
		const { 
			message: request,
			client,
		} = messageContext;

		if (request.type !== 'control-producer-notification') {
			return logger.warn(`Invalid message type ${request.type}`);
		} else if (!client?.mediaProducers.has(request.producerId)) {
			return logger.warn(`Producer ${request.producerId} not found for client ${client.clientId}`);
		}

		const router = cloudSfu.routers.get(client.routerId ?? '');
		const producer = router?.mediaProducers.get(request.producerId);
		
		if (!producer) {
			return logger.warn(`Producer ${request.producerId} not found`);
		}

		try {
			switch (request.action) {
				case 'pause':
					await producer.pause();
					break
				case 'resume':
					await producer.resume();
					break;
				case 'close':
					producer.appData.remoteClosed = true;
					producer.close();
					break;
			}
		} catch (err) {
			logger.warn(`Error occurred while trying to control producer %o`, err);
		}
	};
	return result;
}
