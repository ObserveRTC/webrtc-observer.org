import { ObservedClient, Observer } from "@observertc/observer-js";
import { createLogger } from "../common/logger";
import { MainEmitter } from "../common/MainEmitter";
import { HamokServiceEventMap } from "../services/HamokService";
import { ClientSampleDecoder as LatestClientSampleDecoder, schemaVersion as latestSchemaVersion } from "@observertc/samples-decoder";
import { ObserverGetCallStatsResponse } from "../protocols/MessageProtocol";

const logger = createLogger('ClientMonitorSampleNotificatinListener');

export type ClientMonitorSampleNotificatinListenerContext = {
	observer: Observer,
	mainEmitter: MainEmitter
}

export type ObservedClientAppData = {
	decoder: LatestClientSampleDecoder,
	stats: ObserverGetCallStatsResponse['rooms'][number]['clients'][number],
}

export function createClientMonitorSampleListener(listenerContext: ClientMonitorSampleNotificatinListenerContext) {
	const { 
		observer,
		mainEmitter,
	} = listenerContext;
	const result = async (...options: HamokServiceEventMap['client-sample']) => {
		const [{ 
			callId,
			clientId,
			mediaUnitId,
			userId,
			sampleInBase64,
		}] = options;

		let observedCall = observer.observedCalls.get(callId);

		if (!observedCall) return; // not for this media-server

		let observedClient = observedCall.clients.get(clientId) as ObservedClient<ObservedClientAppData> | undefined;

		if (!observedClient) {
			const newObservedClient = observedCall.createClient<ObservedClientAppData>({
				clientId,
				userId,
				mediaUnitId,
				appData: {
					decoder: new LatestClientSampleDecoder(),
					stats: {
						clientId,
						userId,
						clientScores: [],
						peerConnections: [],
					},
				},
			});

			observedClient = newObservedClient;
		}

		const sample = observedClient.appData.decoder.decodeFromBase64(sampleInBase64);

		observedClient.accept(sample);

		// mainEmitter.emit('sample', {
		// 	clientId,
		// 	callId,
		// 	mediaUnitId: 'webapp',
		// 	roomId,
		// 	sampleInBase64: sample,
		// 	serviceId: 'demo-service',
		// 	userId,
		// });
	};

	return result;
}