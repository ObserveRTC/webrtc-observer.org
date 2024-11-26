import { ObservedCall, ObservedClient, Observer } from "@observertc/observer-js";
import { createLogger } from "../common/logger";
import { HamokServiceEventMap } from "../services/HamokService";
import { ObserverGetCallStatsResponse } from "../protocols/MessageProtocol";
import { ObservedClientAppData } from "./ClientMonitorSampleListener";

const logger = createLogger('GetCallStatsRequestListener');

export type GetCallStatsRequestListenerContext = {
	observer: Observer,
}

export function createGetCallStatsRequestListener(listenerContext: GetCallStatsRequestListenerContext) {
	const { 
		observer,
	} = listenerContext;
	const result = async (...options: HamokServiceEventMap['get-all-call-stats-request']) => {
		const [{ 
			
		}, respond] = options;


		const reply: ObserverGetCallStatsResponse = {
			rooms: [],
		};
		for (const observedCall of observer.observedCalls.values()) {

			const call = observedCall as ObservedCall<{ stats?: ObserverGetCallStatsResponse['rooms'][number]['callScores'] }>;

			if (!call.appData.stats) continue;

			const roomStats: ObserverGetCallStatsResponse['rooms'][number] = {
				roomId: observedCall.roomId,
				callScores: call.appData.stats,
				clients: [],
			};

			for (const observedClient of observedCall.clients.values()) {

				const client = observedClient as ObservedClient<ObservedClientAppData>;
				const clientStats = client.appData.stats
				
				roomStats.clients.push(clientStats);
			}

			reply.rooms.push(roomStats);
		}

		respond(reply);
	};

	return result;
}