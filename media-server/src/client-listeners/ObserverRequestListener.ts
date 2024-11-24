import { Observer } from "@observertc/observer-js";
import { createLogger } from "../common/logger";
import { ClientMessageContext } from "./ClientMessageListener";
import { 
	GetCallConnectionsResponse,
	ObserverGetCallStatsResponse, 
	Response 
} from "../protocols/MessageProtocol";
import { HamokService } from "../services/HamokService";

const logger = createLogger('ClientMonitorSampleNotificatinListener');

export type ClientMonitorSampleNotificatinListenerContext = {
	observer: Observer,
	hamokService: HamokService,
}

export function createObserverRequestListener(listenerContext: ClientMonitorSampleNotificatinListenerContext) {
	const { 
		observer,
		hamokService,
	} = listenerContext;
	const result = async (messageContext: ClientMessageContext) => {
		const { 
			message: request,
			client,
		} = messageContext;
		
		if (request.type !== 'observer-request') {
			return logger.warn(`Invalid message type ${request.type}`);
		}

		const {
			payload,
			type,
		} = request.operation;
		let response: unknown | undefined;
		let error: string | undefined;

		try {
			switch (type) {
				case 'getCallStats': {
					const reply: ObserverGetCallStatsResponse = {
						rooms: [],
					};
					(await hamokService.getAllCallStats({})).forEach(response => reply.rooms.push(...response.rooms));
					
					response = reply;
					break;
				}
				case 'getCallConnections': {
					const reply: GetCallConnectionsResponse = {
						connections: [],
					}
					await hamokService.clients.ready;
					for (const [, callClient] of hamokService.clients.entries()) {
						if (callClient.callId !== client.callId) continue;

						reply.connections.push({
							clientId: callClient.clientId,
							turnUris: callClient.turnUris,
							mediaServerIp: callClient.mediaServerIp,
							userId: callClient.userId,
						});
					}

					response = reply;
					break;
				}
				case 'getHamokState': {
					response = hamokService.getStats();
					break;
				}
			}
		} catch (err) {
			response = undefined;
			error = `${err}`;
		}
		
		messageContext.send(new Response(
			request.requestId,
			response,
			error
		));
	};

	return result;
}