import { ObservedCall, Observer } from "@observertc/observer-js";
import { ClientContext } from "../common/ClientContext";
import { createLogger } from "../common/logger";
import { ClientMessageContext } from "./ClientMessageListener";
import { Kafka, Producer } from "kafkajs";
import { SampleMessage } from "../protocols/SampleMessage";
import { MainEmitter } from "../common/MainEmitter";
import { HamokService } from "../services/HamokService";

const logger = createLogger('ClientMonitorSampleNotificatinListener');

export type ClientMonitorSampleNotificatinListenerContext = {
	// clients: Map<string, ClientContext>,
	// observer: Observer,
	// mainEmitter: MainEmitter
	hamokService: HamokService,
}

export function createClientMonitorSampleNotificatinListener(listenerContext: ClientMonitorSampleNotificatinListenerContext) {
	const { 
		hamokService,
	} = listenerContext;
	const result = async (messageContext: ClientMessageContext) => {
		const { 
			client,
			message: notification,
		} = messageContext;

		if (notification.type !== 'client-monitor-sample-notification') {
			return logger.warn(`Invalid message type ${notification.type}`);
		}
		
		hamokService.publishClientSample({
			callId: client.callId,
			clientId: client.clientId,
			sampleInBase64: notification.sample,
			mediaUnitId: 'webapp',
			roomId: client.roomId,
			serviceId: 'webrtc-observer',
			userId: client.userId,
		});
	};

	return result;
}