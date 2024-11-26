import { ObservedCall } from "@observertc/observer-js/lib/ObservedCall";
import { createLogger } from "../common/logger";
import { 
	ObservedClient, 
} from "@observertc/observer-js";
import { ObserverGetCallStatsResponse } from "../protocols/MessageProtocol";
import { ObservedClientAppData } from "../hamok-listeners/ClientMonitorSampleListener";

const logger = createLogger('ObserverCallStatsMonitor');

export function createObservedCallStatsMonitor(): (call: ObservedCall) => void {
	const createClientUpdateListener = (client: ObservedClient<ObservedClientAppData>) => {
		return () => {

			const clientStats = client.appData.stats;

			logger.debug('Updating client stats for client %s', client.clientId);

			if (!clientStats) return;

			client.score && clientStats.clientScores.push(client.score);

			for (const peerConnection of client.peerConnections.values()) {
				let peerConnectionStats = clientStats.peerConnections.find(pc => pc.peerConnectionId === peerConnection.peerConnectionId);

				if (!peerConnectionStats) {
					peerConnectionStats = {
						peerConnectionId: peerConnection.peerConnectionId,
						peerConnectionScores: [],
						rttMeasurements: [],
						inboundAudioTracks: [],
						inboundVideoTracks: [],
						outboundAudioTracks: [],
						outboundVideoTracks: [],
					};

					clientStats.peerConnections.push(peerConnectionStats);
				}

				peerConnection.score && peerConnectionStats.peerConnectionScores.push(peerConnection.score);

				for (const track of peerConnection.inboundAudioTracks.values()) {
					let trackStats = peerConnectionStats.inboundAudioTracks.find(t => t.trackId === track.trackId);

					if (!trackStats) {
						trackStats = {
							trackId: track.trackId,
							trackScores: [],
							receivingBitrates: [],
							totalLostPackets: [],
						};

						peerConnectionStats.inboundAudioTracks.push(trackStats);
					}

					if (track.score) {
						trackStats.receivingBitrates.push(track.bitrate);
						trackStats.totalLostPackets.push(track.totalLostPackets);
						trackStats.trackScores.push(track.score);
					}

					if (1 < trackStats.trackScores.length) {
						for (
							let duration = trackStats.trackScores[trackStats.trackScores.length - 1].timestamp - trackStats.trackScores[0].timestamp;
							60000 < duration;
							duration = trackStats.trackScores[trackStats.trackScores.length - 1].timestamp - trackStats.trackScores[0].timestamp
						) {
							trackStats.trackScores.shift();
						}
					}
					
					// logger.debug('InboundAudioTrack: %o', track);
				}
				for (const track of peerConnection.inboundVideoTracks.values()) {
					let trackStats = peerConnectionStats.inboundVideoTracks.find(t => t.trackId === track.trackId);

					if (!trackStats) {
						trackStats = {
							trackId: track.trackId,
							trackScores: [],
							receivingBitrates: [],
							totalLostPackets: [],
						};

						peerConnectionStats.inboundVideoTracks.push(trackStats);
					}

					if (track.score) {
						trackStats.receivingBitrates.push(track.bitrate);
						trackStats.totalLostPackets.push(track.totalLostPackets);
						trackStats.trackScores.push(track.score);
					}

					if (1 < trackStats.trackScores.length) {
						for (
							let duration = trackStats.trackScores[trackStats.trackScores.length - 1].timestamp - trackStats.trackScores[0].timestamp;
							60000 < duration;
							duration = trackStats.trackScores[trackStats.trackScores.length - 1].timestamp - trackStats.trackScores[0].timestamp
						) {
							trackStats.trackScores.shift();
						}
					}
					// logger.debug('InboundVideoTrack: %o', track);
				}
				for (const track of peerConnection.outboundAudioTracks.values()) {
					let trackStats = peerConnectionStats.outboundAudioTracks.find(t => t.trackId === track.trackId);

					if (!trackStats) {
						trackStats = {
							trackId: track.trackId,
							trackScores: [],
							sendingBitrates: [],
						};

						peerConnectionStats.outboundAudioTracks.push(trackStats);
					}

					if (track.score) {
						trackStats.sendingBitrates.push(track.bitrate);
						trackStats.trackScores.push(track.score);
					}

					if (1 < trackStats.trackScores.length) {
						for (
							let duration = trackStats.trackScores[trackStats.trackScores.length - 1].timestamp - trackStats.trackScores[0].timestamp;
							60000 < duration;
							duration = trackStats.trackScores[trackStats.trackScores.length - 1].timestamp - trackStats.trackScores[0].timestamp
						) {
							trackStats.trackScores.shift();
						}
					}
					// logger.debug('OutboundAudioTrack: %o', track);
				}
				for (const track of peerConnection.outboundVideoTracks.values()) {
					let trackStats = peerConnectionStats.outboundVideoTracks.find(t => t.trackId === track.trackId);

					if (!trackStats) {
						trackStats = {
							trackId: track.trackId,
							trackScores: [],
							sendingBitrates: [],
						};

						peerConnectionStats.outboundVideoTracks.push(trackStats);
					}

					if (track.score) {
						trackStats.sendingBitrates.push(track.bitrate);
						trackStats.trackScores.push(track.score);
					}

					if (1 < trackStats.trackScores.length) {
						for (
							let duration = trackStats.trackScores[trackStats.trackScores.length - 1].timestamp - trackStats.trackScores[0].timestamp;
							60000 < duration;
							duration = trackStats.trackScores[trackStats.trackScores.length - 1].timestamp - trackStats.trackScores[0].timestamp
						) {
							trackStats.trackScores.shift();
						}
					}
					// logger.debug('OutboundVideoTrack: %o', track);
				}
			}


			// no more than 1 minutes of data
			if (1 < clientStats.clientScores.length) {
				for (
					let duration = clientStats.clientScores[clientStats.clientScores.length - 1].timestamp - clientStats.clientScores[0].timestamp;
					60000 < duration;
					duration = clientStats.clientScores[clientStats.clientScores.length - 1].timestamp - clientStats.clientScores[0].timestamp
				) {
					clientStats.clientScores.shift();
				}
			}
			

			for (const peerConnection of clientStats.peerConnections) {
				if (peerConnection.peerConnectionScores.length < 1) continue;

				if (1 < peerConnection.peerConnectionScores.length) {
					for (
						let duration = peerConnection.peerConnectionScores[peerConnection.peerConnectionScores.length - 1].timestamp - peerConnection.peerConnectionScores[0].timestamp;
						60000 < duration;
						duration = peerConnection.peerConnectionScores[peerConnection.peerConnectionScores.length - 1].timestamp - peerConnection.peerConnectionScores[0].timestamp
					) {
						peerConnection.peerConnectionScores.shift();
					}
				}	
				
				const firstTimestamp = peerConnection.peerConnectionScores[0].timestamp;

				if (firstTimestamp < Date.now() - 60000) {
					clientStats.peerConnections = clientStats.peerConnections.filter(pc => pc.peerConnectionId !== peerConnection.peerConnectionId);
				}
			}
		}
	}

	const clientMonitor = (client: ObservedClient) => {
		const onUpdateListener = createClientUpdateListener(client as ObservedClient<ObservedClientAppData>);

		client.once('close', () => {
			client.off('update', onUpdateListener);
		});

		client.on('update', onUpdateListener);
	}

	return (call: ObservedCall) => {
		
		// here we need an interval to update the call score!
		const timer = setInterval(() => {
			const stats = call.appData.stats as ObserverGetCallStatsResponse['rooms'][number]['callScores'] | undefined;

			logger.debug('Updating call stats for call %s, score: %o', call.callId, call.score);

			if (!stats) {
				clearInterval(timer);
				return;
			}


			const callScore = call.score;
			if (callScore) {
				stats.push(callScore);
			}

			// no more than 1 minutes of data
			while (12 < stats.length) {
				stats.shift();
			}
		}, 5000);

		call.once('close', () => {
			call.off('newclient', clientMonitor);
			clearInterval(timer);
		});
		
		call.on('newclient', clientMonitor);
	};
}