import { Observer } from "@observertc/observer-js";
import { createLogger } from "../common/logger";
import { ClientMessageContext } from "./ClientMessageListener";
import { 
	GetCallConnectionsResponse,
	ObserverGetCallStatsResponse, 
	Response 
} from "../protocols/MessageProtocol";

const logger = createLogger('ClientMonitorSampleNotificatinListener');

export type ClientMonitorSampleNotificatinListenerContext = {
	observer: Observer,
}

export function createObserverRequestListener(listenerContext: ClientMonitorSampleNotificatinListenerContext) {
	const { 
		observer,
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
					
					response = reply;
					break;
				}
				case 'getCallConnections': {
					const reply: GetCallConnectionsResponse = {
						connections: [],
					}

					response = reply;
					break;
				}
				case 'getHamokState': {
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