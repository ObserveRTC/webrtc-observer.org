import { createLogger } from "../common/logger";
import { HamokServiceEventMap } from "../services/HamokService";
import { MediasoupService } from "../services/MediasoupService";

const logger = createLogger('ConnectPipeTransportListener');

export type CreateConnectPipeTransportListenerContext = {
	mediasoupService: MediasoupService,
}

export function createConnectPipeTransportListener(listenerContext: CreateConnectPipeTransportListenerContext) {
	const { 
		mediasoupService,
	} = listenerContext;

	const result = async (...options: HamokServiceEventMap['connect-pipe-transport-request']) => {
		const [{ 
			dstRouterId,
			srcRouterId,
			ip,
			port,
		}, respond] = options;

		if (!mediasoupService.routers.has(srcRouterId)) return;

		logger.debug(`Requested to connect pipe transport from router ${srcRouterId} to router ${dstRouterId}, ip: ${ip}, port: ${port}`);

		let error: string | undefined;
		try {
			const transport = await mediasoupService.getOrCreatePipeTransport(srcRouterId, dstRouterId);

			if (!transport.appData.connecting) {
				logger.debug(`Connecting pipe transport from router ${srcRouterId} to router ${dstRouterId}, ip: ${ip}, port: ${port}`);
				transport.appData.connecting = transport.connect({
					ip, 
					port,
				})
			}

			await transport.appData.connecting;

			transport.appData.connected = true;

		} catch (err) {
			error = `Failed to create pipe transport: ${err}`;
		}
		
		respond(error)
	};

	return result;
}