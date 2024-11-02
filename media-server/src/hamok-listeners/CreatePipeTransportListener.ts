import { createLogger } from "../common/logger";
import { HamokServiceEventMap } from "../services/HamokService";
import { MediasoupService } from "../services/MediasoupService";

const logger = createLogger('CreatePipeTransportListener');

export type CreatePipeTransportListenerContext = {
	mediasoupService: MediasoupService,
}

export function createPipeTransportListener(listenerContext: CreatePipeTransportListenerContext) {
	const { 
		mediasoupService,
	} = listenerContext;

	const result = async (...options: HamokServiceEventMap['create-pipe-transport-request']) => {
		const [{ 
			dstRouterId,
			srcRouterId,
		}, respond] = options;

		if (!mediasoupService.routers.has(srcRouterId)) return;

		try {
			const transport = await mediasoupService.getOrCreatePipeTransport(srcRouterId, dstRouterId);

			respond({
				ip: transport.tuple.localIp,
				port: transport.tuple.localPort,
			});
		} catch (err) {
			respond(undefined, `${err}`)
		}
		
		
	};

	return result;
}