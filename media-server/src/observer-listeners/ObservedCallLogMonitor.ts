import { ObservedCall } from "@observertc/observer-js/lib/ObservedCall";
import { createLogger } from "../common/logger";
import { 
	ObservedClient, 
	ObservedInboundAudioTrack, 
	ObservedInboundVideoTrack, 
	ObservedOutboundAudioTrack, 
	ObservedOutboundVideoTrack, 
	ObservedPeerConnection, 
} from "@observertc/observer-js";

const logger = createLogger('ObserverCallLogMonitor');

export function createObservedCallLogMonitor(): (call: ObservedCall) => void {

	const inboundAudioTrackMonitor = (track: ObservedInboundAudioTrack) => {
		track.once('close', () => {
			logger.debug(`InboundAudioTrack ${track.trackId} in peerConnection: ${track.peerConnection.peerConnectionId}, label: ${track.peerConnection.label}, client: ${track.peerConnection.client.clientId}, call: ${track.peerConnection.client.call.callId}, room: ${track.peerConnection.client.call.roomId} is REMOVED`);
		});

		logger.debug(`InboundAudioTrack ${track.trackId} in peerConnection: ${track.peerConnection.peerConnectionId}, label: ${track.peerConnection.label}, client: ${track.peerConnection.client.clientId}, call: ${track.peerConnection.client.call.callId}, room: ${track.peerConnection.client.call.roomId} is ADDED`);
	}

	const inboundVideoTrackMonitor = (track: ObservedInboundVideoTrack) => {
		track.once('close', () => {
			logger.debug(`InboundVideoTrack ${track.trackId} in peerConnection: ${track.peerConnection.peerConnectionId}, label: ${track.peerConnection.label}, client: ${track.peerConnection.client.clientId}, call: ${track.peerConnection.client.call.callId}, room: ${track.peerConnection.client.call.roomId} is REMOVED`);
		});

		logger.debug(`InboundVideoTrack ${track.trackId} in peerConnection: ${track.peerConnection.peerConnectionId}, label: ${track.peerConnection.label}, client: ${track.peerConnection.client.clientId}, call: ${track.peerConnection.client.call.callId}, room: ${track.peerConnection.client.call.roomId} is ADDED`);
	}

	const outboundAudioTrackMonitor = (track: ObservedOutboundAudioTrack) => {
		track.once('close', () => {
			logger.debug(`OutboundAudioTrack ${track.trackId} in peerConnection: ${track.peerConnection.peerConnectionId}, label: ${track.peerConnection.label}, client: ${track.peerConnection.client.clientId}, call: ${track.peerConnection.client.call.callId}, room: ${track.peerConnection.client.call.roomId} is REMOVED`);
		});

		logger.debug(`OutboundAudioTrack ${track.trackId} in peerConnection: ${track.peerConnection.peerConnectionId}, label: ${track.peerConnection.label}, client: ${track.peerConnection.client.clientId}, call: ${track.peerConnection.client.call.callId}, room: ${track.peerConnection.client.call.roomId} is ADDED`);
	}

	const outboundVideoTrackMonitor = (track: ObservedOutboundVideoTrack) => {
		track.once('close', () => {
			logger.debug(`OutboundVideoTrack ${track.trackId} in peerConnection: ${track.peerConnection.peerConnectionId}, label: ${track.peerConnection.label}, client: ${track.peerConnection.client.clientId}, call: ${track.peerConnection.client.call.callId}, room: ${track.peerConnection.client.call.roomId} is REMOVED`);
		});

		logger.debug(`OutboundVideoTrack ${track.trackId} in peerConnection: ${track.peerConnection.peerConnectionId}, label: ${track.peerConnection.label}, client: ${track.peerConnection.client.clientId}, call: ${track.peerConnection.client.call.callId}, room: ${track.peerConnection.client.call.roomId} is ADDED`);
	}

	const peerConnectionMonitor = (peerConnection: ObservedPeerConnection) => {
		peerConnection.once('close', () => {
			peerConnection.off('newinboudaudiotrack', inboundAudioTrackMonitor);
			peerConnection.off('newinboudvideotrack', inboundVideoTrackMonitor);
			peerConnection.off('newoutboundaudiotrack', outboundAudioTrackMonitor);
			peerConnection.off('newoutboundvideotrack', outboundVideoTrackMonitor);

			logger.debug(`PeerConnection ${peerConnection.peerConnectionId}, label: ${peerConnection.label} in client: ${peerConnection.client.clientId}, call: ${peerConnection.client.call.callId}, room: ${peerConnection.client.call.roomId} is CLOSED`);
		});
		peerConnection.on('newinboudaudiotrack', inboundAudioTrackMonitor);
		peerConnection.on('newinboudvideotrack', inboundVideoTrackMonitor);
		peerConnection.on('newoutboundaudiotrack', outboundAudioTrackMonitor);
		peerConnection.on('newoutboundvideotrack', outboundVideoTrackMonitor);

		logger.debug(`PeerConnection ${peerConnection.peerConnectionId}, label: ${peerConnection.label} in client: ${peerConnection.client.clientId}, call: ${peerConnection.client.call.callId}, room: ${peerConnection.client.call.roomId} is OPENED`);
	}

	const clientMonitor = (client: ObservedClient) => {
		client.once('close', () => {
			client.off('newpeerconnection', peerConnectionMonitor);

			logger.debug(`Client ${client.clientId} in call: ${client.call.callId}, room: ${client.call.roomId} is LEFT`);
		});

		client.on('newpeerconnection', peerConnectionMonitor);

		logger.debug(`Client ${client.clientId} in call: ${client.call.callId}, room: ${client.call.roomId} is JOINED`);
	}

	return (call: ObservedCall) => {
		call.once('close', () => {
			call.off('newclient', clientMonitor);

			logger.debug(`Call ${call.callId} in room ${call.roomId} is ENDED`)
		});
		call.on('newclient', clientMonitor);

		logger.debug(`Call ${call.callId} in room ${call.roomId} is STARTED`);
	};
}