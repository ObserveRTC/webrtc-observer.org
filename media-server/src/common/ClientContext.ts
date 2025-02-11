import WebSocket from 'ws';
import * as mediasoup from 'mediasoup';
import { ClientMessage } from '../protocols/MessageProtocol';
import { createLogger } from './logger';
import { ClientSampleDecoder } from '@observertc/samples-decoder';

const logger = createLogger('Client');

export type ClientContext = {
	// routerId?: string,
	created: number,
	roomId: string,
	callId: string,
	clientId: string,
	sndTransport?: mediasoup.types.WebRtcTransport;
	rcvTransport?: mediasoup.types.WebRtcTransport;
	userId: string,
	webSocket: WebSocket,
	mediaProducers: Set<string>;
	mediaConsumers: Set<string>;
	send: (message: ClientMessage) => void;
	routerId?: string,
}

/**
 * {
		if (this.webSocket.readyState !== WebSocket.OPEN) {
			return logger.warn(`Attempted to send a message on a closed Client`);
		}
		this.webSocket.send(JSON.stringify(message));
	}
 */