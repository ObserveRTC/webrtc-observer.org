import { ObservedClient, Observer } from "@observertc/observer-js";
import { createLogger } from "../common/logger";
import { MainEmitter } from "../common/MainEmitter";
import { HamokServiceEventMap } from "../services/HamokService";
import { ClientSampleDecoder as LatestClientSampleDecoder, schemaVersion as latestSchemaVersion } from "@observertc/samples-decoder";
import { ObserverGetCallStatsResponse } from "../protocols/MessageProtocol";

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
			const roomStats: ObserverGetCallStatsResponse['rooms'][number] = {
				roomId: observedCall.roomId,
				callScore: observedCall.score,
				clients: [],
			};
			for (const client of observedCall.clients.values()) {
				const clientStats: ObserverGetCallStatsResponse['rooms'][number]['clients'][number] = {
					clientId: client.clientId,
					clientScore: client.score,
					peerConnections: [],
				};

				// logger.info('Client: %o', client);
				for (const peerConnection of client.peerConnections.values()) {
					const peerConnectionStats: ObserverGetCallStatsResponse['rooms'][number]['clients'][number]['peerConnections'][number] = {
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
				reply.rooms.push(roomStats);
			}
		}

		respond(reply);
	};

	return result;
}