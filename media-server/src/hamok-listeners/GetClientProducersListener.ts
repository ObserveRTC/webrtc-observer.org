import { createLogger } from "../common/logger";
import { Server } from "../Server";
import { HamokServiceEventMap } from "../services/HamokService";
import { MediasoupService } from "../services/MediasoupService";

const logger = createLogger('GetClientProducers');

export type CreateGetClientProducersListenerContext = {
	mediasoupService: MediasoupService,
	server: Server,
}

export function createGetClientProducersListener(listenerContext: CreateGetClientProducersListenerContext) {
	const { 
		mediasoupService,
		server,
	} = listenerContext;

	const result = async (...options: HamokServiceEventMap['get-client-producers-request']) => {
		const [{ 
			clientId,
		}, respond] = options;

		const client = server.clients.get(clientId);

		logger.info(`GetClientProducersListener: ${clientId}: %o`, client);

		if (!client || !client.routerId) return;

		respond({
			mediaProducerIds: Array.from(client.mediaProducers),
		})
	};

	return result;
}