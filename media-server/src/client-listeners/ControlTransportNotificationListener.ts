import { ClientContext } from "../common/ClientContext";
import { createLogger } from "../common/logger";
import { MediasoupService } from "../services/MediasoupService"
import { ClientMessageContext } from "./ClientMessageListener";

const logger = createLogger('CreateProducerNotificationListener');

export type CreateControlTransportNotificationListenerContext = {
}

export function createControlTransportNotificationListener(listenerContext: CreateControlTransportNotificationListenerContext) {
	const { 
	} = listenerContext;
	const result = async (messageContext: ClientMessageContext) => {
		const { 
			message: notification,
			client,
		} = messageContext;
		
		if (notification.type !== 'control-transport-notification') {
			return logger.warn(`Invalid message type ${notification.type}`);
		}

		try {
			const transport = notification.transportId === client.sndTransport?.id
				? client.sndTransport
				: notification.transportId === client.rcvTransport?.id
				? client.rcvTransport
				: undefined;

			if (!transport) {
				return logger.warn(`Transport ${notification.transportId} not found for client ${client.clientId}`);
			}

			switch (notification.action) {
				case 'close': {
					transport.close();
					break;
				}
			}
		} catch (err) {
			logger.warn(`Error occurred while trying to control transport %o`, err);
		}
	};
	return result;
}