import { Observer } from "@observertc/observer-js";
import { ClientContext } from "../common/ClientContext";
import { createLogger } from "../common/logger";
import { ClientMessageContext } from "./ClientMessageListener";
import { 
	GetCallConnectionsResponse,
	ObservedGetOngoingCallResponse, 
	ObserverGetCallStatsResponse, 
	Response 
} from "../protocols/MessageProtocol";
import { HamokService } from "../services/HamokService";
import { connect } from "http2";

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
				case 'getOngoingCalls': {
					let reply: ObservedGetOngoingCallResponse = {
						calls: [],
					};

					for (const [callId, observedCall] of observer.observedCalls) {
						const clients: ObservedGetOngoingCallResponse['calls'][number]['clients'] = [];

						for (const [clientId, observedClient] of observedCall.clients) {
							const peerConnections: ObservedGetOngoingCallResponse['calls'][number]['clients'][number]['peerConnections'] = [];

							for (const [peerConnectionId, observedPeerConnection] of observedClient.peerConnections) {
								peerConnections.push({
									peerConnectionId,
									inboundAudioTrackIds: Array.from(observedPeerConnection.inboundAudioTracks.keys()),
									inboundVideoTrackIds: Array.from(observedPeerConnection.inboundVideoTracks.keys()),
									outboundAudioTrackIds: Array.from(observedPeerConnection.outboundAudioTracks.keys()),
									outboundVideoTrackIds: Array.from(observedPeerConnection.outboundVideoTracks.keys()),
								});
							}

							clients.push({
								clientId,
								peerConnections,
							});
						}

						reply.calls.push({
							callId,
							clients,
						});
					}

					response = reply;
					break;
				}
				case 'getCallStats': {
					const observedCall = observer.observedCalls.get(payload.callId);

					if (!observedCall) {
						error = `Call ${payload.callId} not found`;
						break;
					}

					const reply: ObserverGetCallStatsResponse = {
						callScore: observedCall.score,
						clients: [],
					};
					for (const client of observedCall.clients.values()) {
						const clientStats: ObserverGetCallStatsResponse['clients'][number] = {
							clientId: client.clientId,
							clientScore: client.score,
							peerConnections: [],
						};
						// logger.info('Client: %o', client);
						for (const peerConnection of client.peerConnections.values()) {
							const peerConnectionStats: ObserverGetCallStatsResponse['clients'][number]['peerConnections'][number] = {
								peerConnectionId: peerConnection.peerConnectionId,
								peerConnectionScore: peerConnection.score,
								avgRttInMs: peerConnection.avgRttInMs ?? 0,
								inboundAudioTracks: [],
								inboundVideoTracks: [],
								outboundAudioTracks: [],
								outboundVideoTracks: [],
							};
							for (const track of peerConnection.inboundAudioTracks.values()) {
								peerConnectionStats.inboundAudioTracks.push({
									trackId: track.trackId,
									trackScore: track.score,
									receivingBitrate: track.bitrate,
									totalLostPackets: track.totalLostPackets,
								});
								// logger.debug('InboundAudioTrack: %o', track);
							}
							for (const track of peerConnection.inboundVideoTracks.values()) {
								peerConnectionStats.inboundVideoTracks.push({
									trackId: track.trackId,
									trackScore: track.score,
									receivingBitrate: track.bitrate,
									totalLostPackets: track.totalLostPackets,
								});
								// logger.debug('InboundVideoTrack: %o', track);
							}
							for (const track of peerConnection.outboundAudioTracks.values()) {
								peerConnectionStats.outboundAudioTracks.push({
									trackId: track.trackId,
									trackScore: track.score,
									sendingBitrate: track.sendingBitrate,
								});
								// logger.debug('OutboundAudioTrack: %o', track);
							}
							for (const track of peerConnection.outboundVideoTracks.values()) {
								peerConnectionStats.outboundVideoTracks.push({
									trackId: track.trackId,
									trackScore: track.score,
									sendingBitrate: track.sendingBitrate,
								});
								// logger.debug('OutboundVideoTrack: %o', track);
							}
							clientStats.peerConnections.push(peerConnectionStats);
							// logger.debug('PeerConnection: %o', peerConnectionStats);
						}
						reply.clients.push(clientStats);
					}
					response = reply;
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
				}
				case 'getHamokState': {
					response = hamokService.getStats();
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