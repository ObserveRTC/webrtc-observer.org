import { CertificateMonitor, ClientMonitor, CodecMonitor, DataChannelMonitor, IceCandidateMonitor, IceCandidatePairMonitor, IceTransportMonitor, InboundRtpMonitor, InboundTrackMonitor, MediaPlayoutMonitor, MediaSourceMonitor, OutboundRtpMonitor, OutboundTrackMonitor, PeerConnectionMonitor, PeerConnectionTransportMonitor, RemoteInboundRtpMonitor, RemoteOutboundRtpMonitor } from '@observertc/client-monitor-js';
import { 
	ShowObjectProps, 
	ShowObjectAccessorArrayItem, 
	ShowObjectAccessor, 
	ShowObjectProperties
} from '../components/ClientMonitor/ShowObject';
import { createSignal } from 'solid-js';

// eslint-disable-next-line no-unused-vars
// function getResultOrEmpty<T>(accessor: (i: T) => ShowObjectAccessor, value?: T): ShowObjectAccessor {
// 	if (value) return accessor(value);

// 	const [result] = createSignal<ShowObjectProperties>({});
	
// 	return () => ({
// 		properties: result,
// 		cleanup: () => {}
// 	});
// }

function getObjectFields<T extends Object>(object: T, ...except: (keyof T)[])  {
	const keys = Object.keys(object).filter((key) => !except.includes(key as keyof T));
	const result: Record<string, unknown> = {};
	for (const key of keys) {
		if (key[0] === '_') continue;
		if (key.startsWith('detectors') && (object as any)[key]?.constructor.name === 'Detectors') continue;
		if (key.startsWith('mapped') && (object as any)[key] instanceof Map) continue;
		result[key] = (object as any)[key];
	}

	return result;
}

// eslint-disable-next-line no-unused-vars
function getResultOrEmpty<T>(accessor: (i: T) => ShowObjectAccessor, value?: T): ShowObjectAccessor {
	return () => {
		if (value) return accessor(value)();

		const [result] = createSignal<ShowObjectProperties>({});
		
		return {
			properties: result,
			cleanup: () => {}
		};
	};
}

function getPrimitiveProps(value: number | undefined | null | string): ShowObjectAccessor {
	const [result, setResult] = createSignal<ShowObjectProperties>({});

	setResult(value);

	return () => ({
		properties: result,
		cleanup: () => setResult({})
	});
}



export function createClientMonitorProps(monitor: ClientMonitor): ShowObjectProps {
	const [monitorProps, setMonitorProps] = createSignal<ShowObjectProperties & object>({});
	
	const listener = () => {
		setMonitorProps({
			sendingAudioBitrate: monitor.sendingAudioBitrate,
			sendingVideoBitrate: monitor.sendingVideoBitrate,
			receivingAudioBitrate: monitor.receivingAudioBitrate,
			receivingVideoBitrate: monitor.receivingVideoBitrate,

			totalAvailableIncomingBitrate: monitor.totalAvailableIncomingBitrate,
			totalAvailableOutgoingBitrate: monitor.totalAvailableOutgoingBitrate,

			avgRttInSec: monitor.avgRttInSec,
			score: monitor.score,

			peerConnections: createPeerConnectionArrayProps(monitor.peerConnections),
			certificates: createCertificateArrayProps(monitor.certificates),
			codecs: createCodecArrayProps(monitor.codecs),
			dataChannels: createDataChannelArrayProps(monitor.dataChannels),
			iceCandidatePairs: createIceCandidatePairArrayProps(monitor.iceCandidatePairs),
			iceCandidates: createIceCandidateArrayProps(monitor.iceCandidates),
			iceTransports: createIceTransportArrayProps(monitor.iceTransports),
			inboundRtps: createInboundRtpArrayProps(monitor.inboundRtps),
			mediaPlayouts: createMediaPlayoutArrayProps(monitor.mediaPlayouts),
			mediaSources: createMediaSourceArrayProps(monitor.mediaSources),
			outboundRtps: createOutboundRtpArrayProps(monitor.outboundRtps),
			remoteInboundRtps: createRemoteInboundRtpArrayProps(monitor.remoteInboundRtps),
			remoteOutboundRtps: createRemoteOutboundRtpArrayProps(monitor.remoteOutboundRtps),
			// tracks: [
			// 	...createInboundTrackArrayProps((monitor.tracks.filter((track) => track.direction === 'inbound') as InboundTrackMonitor[])),
			// 	...createOutboundTrackArrayProps((monitor.tracks.filter((track) => track.direction === 'outbound') as OutboundTrackMonitor[]))
			// ]
            
		});
	};

	monitor.on('stats-collected', listener);

	return {
		properties: monitorProps,
		cleanup: () => {
			monitor.off('stats-collected', listener);
		}
	};
}

function createPeerConnectionArrayProps(peerConnections: PeerConnectionMonitor[]): ShowObjectAccessorArrayItem[] {
	return peerConnections.map((pc) => {
		return {
			key: pc.peerConnectionId,
			accessor: createPeerConnectionProps(pc)
		};
	});
}

function createPeerConnectionProps(peerConnection: PeerConnectionMonitor): ShowObjectAccessor {
	const [peerConnectionProps, setPeerConnectionProps] = createSignal<ShowObjectProperties>({});

	// const codecs = [...peerConnection.codecs()];

	// console.warn('codecs', codecs);

	setPeerConnectionProps({
		...getObjectFields(peerConnection, 'parent', 'calculatedStabilityScore', 'detectors'),
		// peerConnectionId: peerConnection.peerConnectionId,
		// usingTCP: peerConnection.usingTCP,
		// usingTURN: peerConnection.usingTURN,

		// totalInboundPacketsLost: peerConnection.totalInboundPacketsLost,
		// totalInboundPacketsReceived: peerConnection.totalInboundPacketsReceived,
		// totalOutboundPacketsLost: peerConnection.totalOutboundPacketsLost,
		// totalOutboundPacketsReceived: peerConnection.totalOutboundPacketsReceived,
		// totalOutboundPacketsSent: peerConnection.totalOutboundPacketsSent,
		// totalSentAudioBytes: peerConnection.totalSentAudioBytes,
		// totalSentVideoBytes: peerConnection.totalSentVideoBytes,
		// totalReceivedAudioBytes: peerConnection.totalReceivedAudioBytes,
		// totalReceivedVideoBytes: peerConnection.totalReceivedVideoBytes,
		// totalDataChannelBytesReceived: peerConnection.totalDataChannelBytesReceived,
		// totalDataChannelBytesSent: peerConnection.totalDataChannelBytesSent,

		// deltaAudioBytesReceived: peerConnection.ΔaudioBytesReceived,
		// deltaAudioBytesSent: peerConnection.ΔaudioBytesSent,
		// deltaVideoBytesReceived: peerConnection.ΔvideoBytesReceived,
		// deltaVideoBytesSent: peerConnection.ΔvideoBytesSent,
		// deltaDataChannelBytesReceived: peerConnection.ΔdataChannelBytesReceived,
		// deltaDataChannelBytesSent: peerConnection.ΔdataChannelBytesSent,
		// ΔinboundPacketsLost: peerConnection.ΔinboundPacketsLost,
		// ΔinboundPacketsReceived: peerConnection.ΔinboundPacketsReceived,
		// ΔoutboundPacketsLost: peerConnection.ΔoutboundPacketsLost,
		// ΔoutboundPacketsReceived: peerConnection.ΔoutboundPacketsReceived,
		// ΔoutboundPacketsSent: peerConnection.ΔoutboundPacketsSent,

		// avgRttInSec: peerConnection.avgRttInSec,

		score: peerConnection.score,
		calculatedStabilityScore: peerConnection.calculatedStabilityScore,

		certificates: createCertificateArrayProps(peerConnection.certificates),
		codecs: createCodecArrayProps(peerConnection.codecs),
		dataChannels: createDataChannelArrayProps(peerConnection.dataChannels),
		iceCandidatePairs: createIceCandidatePairArrayProps(peerConnection.iceCandidatePairs),
		iceCandidates: createIceCandidateArrayProps(peerConnection.iceCandidates),
		iceTransports: createIceTransportArrayProps(peerConnection.iceTransports),
		inboundRtps: createInboundRtpArrayProps(peerConnection.inboundRtps),
		mediaPlayouts: createMediaPlayoutArrayProps(peerConnection.mediaPlayouts),
		mediaSources: createMediaSourceArrayProps(peerConnection.mediaSources),
		outboundRtps: createOutboundRtpArrayProps(peerConnection.outboundRtps),
		peerConnectionTransports: createPeerConnectionTransportArrayProps(peerConnection.peerConnectionTransports),
		remoteInboundRtps: createRemoteInboundRtpArrayProps(peerConnection.remoteInboundRtps),
		remoteOutboundRtps: createRemoteOutboundRtpArrayProps(peerConnection.remoteOutboundRtps),
		selectedIceCandidatePairs: createIceCandidatePairArrayProps(peerConnection.selectedIceCandidatePairs),
		// tracks: [
		// 	...createInboundTrackArrayProps((peerConnection.tracks.filter((track) => track.direction === 'inbound') as InboundTrackMonitor[])),
		// 	...createOutboundTrackArrayProps((peerConnection.tracks.filter((track) => track.direction === 'outbound') as OutboundTrackMonitor[]))
		// ]
	});

	// monitor.on('stats-collected', listener);
	return () => ({
		properties: peerConnectionProps,
		cleanup: () => setPeerConnectionProps({})
	});
}

// function wrapArayToAccessor<T>(key: string, func: (values: T[]) => ShowObjectAccessorArrayItem[]): ShowObjectAccessor {
// 	const [accesssor, setAccessor] = createSignal<ShowObjectProperties>({});

// 	return () => ({
// 		properties: accesssor,
// 		cleanup: () => setAccessor({}),
// 	});
// }

function createCertificateArrayProps(monitors: CertificateMonitor[]): ShowObjectAccessorArrayItem[] {
	return monitors.map((monitor) => {
		return {
			key: monitor.id,
			accessor: createCertificateProps(monitor)
		};
	});
}

function createCertificateProps(monitor: CertificateMonitor): ShowObjectAccessor {
	const [monitorProps, setMonitorProps] = createSignal<ShowObjectProperties>({});

	setMonitorProps({
		...getObjectFields(monitor, 'visited'),

		// Peer connection info
		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, monitor.getPeerConnection()),
	});

	return () => ({
		properties: monitorProps,
		cleanup: () => setMonitorProps({})
	});
}


function createCodecArrayProps(codecs: CodecMonitor[]): ShowObjectAccessorArrayItem[] {
	return codecs.map((codec) => {
		return {
			key: codec.id,
			accessor: createCodecProps(codec)
		};
	});
}

function createCodecProps(codec: CodecMonitor): ShowObjectAccessor {
	const [codecsProps, setCodecsProps] = createSignal<ShowObjectProperties>({});
	
	setCodecsProps({
		...getObjectFields(codec, 'visited'),

		getIceTransport: getResultOrEmpty(createIceTransportProps, codec.getIceTransport()),
		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, codec.getPeerConnection())
	});

	return () => ({
		properties: codecsProps,
		cleanup: () => setCodecsProps({})
	});
}

function createDataChannelArrayProps(dataChannels: DataChannelMonitor[]): ShowObjectAccessorArrayItem[] {
	return dataChannels.map((dataChannel) => {
		return {
			key: dataChannel.id,
			accessor: createDataChannelProps(dataChannel)
		};
	});
}

function createDataChannelProps(dataChannel: DataChannelMonitor): ShowObjectAccessor {
	const [dataChannelProps, setDataChannelProps] = createSignal<ShowObjectProperties>({});

	setDataChannelProps({
		...getObjectFields(dataChannel, 'visited'),

		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, dataChannel.getPeerConnection())
	});

	return () => ({
		properties: dataChannelProps,
		cleanup: () => setDataChannelProps({})
	});
}

function createIceCandidateArrayProps(candidates: IceCandidateMonitor[]): ShowObjectAccessorArrayItem[] {
	return candidates.map((candidate) => {
		return {
			key: candidate.id,
			accessor: createIceCandidateProps(candidate)
		};
	});
}

function createIceCandidateProps(candidate: IceCandidateMonitor): ShowObjectAccessor {
	const [candidateProps, setCandidateProps] = createSignal<ShowObjectProperties>({});

	setCandidateProps({
		...getObjectFields(candidate, 'visited'),

		getIceTransport: getResultOrEmpty(createIceTransportProps, candidate.getIceTransport()),
		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, candidate.getPeerConnection())
	});

	return () => ({
		properties: candidateProps,
		cleanup: () => setCandidateProps({})
	});
}

function createIceCandidatePairArrayProps(pairs: IceCandidatePairMonitor[]): ShowObjectAccessorArrayItem[] {
	return pairs.map((pair) => {
		return {
			key: pair.id,
			accessor: createIceCandidatePairProps(pair)
		};
	});
}

function createIceCandidatePairProps(pair: IceCandidatePairMonitor): ShowObjectAccessor {
	const [pairProps, setPairProps] = createSignal<ShowObjectProperties>({});

	setPairProps({
		...getObjectFields(pair, 'visited'),

		getIceTransport: getResultOrEmpty(createIceTransportProps, pair.getIceTransport()),
		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, pair.getPeerConnection()),
		getLocalCandidate: getResultOrEmpty(createIceCandidateProps, pair.getLocalCandidate()),
		getRemoteCandidate: getResultOrEmpty(createIceCandidateProps, pair.getRemoteCandidate())
	});

	return () => ({
		properties: pairProps,
		cleanup: () => setPairProps({})
	});
}

function createIceTransportArrayProps(transports: IceTransportMonitor[]): ShowObjectAccessorArrayItem[] {
	return transports.map((transport) => {
		return {
			key: transport.id,
			accessor: createIceTransportProps(transport)
		};
	});
}

function createIceTransportProps(transport: IceTransportMonitor): ShowObjectAccessor {
	const [transportProps, setTransportProps] = createSignal<ShowObjectProperties>({});

	setTransportProps({
		...getObjectFields(transport, 'visited'),

		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, transport.getPeerConnection()),
		getSelectedCandidatePair: getResultOrEmpty(createIceCandidatePairProps, transport.getSelectedCandidatePair())
	});

	return () => ({
		properties: transportProps,
		cleanup: () => setTransportProps({})
	});
}

function createInboundRtpArrayProps(monitors: InboundRtpMonitor[]): ShowObjectAccessorArrayItem[] {
	return monitors.map((monitor) => {
		return {
			key: monitor.id,
			accessor: createInboundRtpProps(monitor)
		};
	});
}

function createInboundRtpProps(monitor: InboundRtpMonitor): ShowObjectAccessor {
	const [monitorProps, setMonitorProps] = createSignal<ShowObjectProperties>({});

	setMonitorProps({
		...getObjectFields(monitor, 'visited'),

		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, monitor.getPeerConnection()),
		getRemoteOutboundRtp: getResultOrEmpty(createRemoteOutboundRtpProps, monitor.getRemoteOutboundRtp()),
		getIceTransport: getResultOrEmpty(createIceTransportProps, monitor.getIceTransport()),
		getCodec: getResultOrEmpty(createCodecProps, monitor.getCodec()),
		getMediaPlayout: getResultOrEmpty(createMediaPlayoutProps, monitor.getMediaPlayout()),
		getTrack: getResultOrEmpty(createInboundTrackProps, monitor.getTrack())
	});

	return () => ({
		properties: monitorProps,
		cleanup: () => setMonitorProps({})
	});
}

function createInboundTrackArrayProps(monitors: InboundTrackMonitor[]): ShowObjectAccessorArrayItem[] {
	return monitors.map((monitor) => {
		return {
			key: monitor.track.id,
			accessor: createInboundTrackProps(monitor)
		};
	});
}

function createInboundTrackProps(monitor: InboundTrackMonitor): ShowObjectAccessor {
	const [monitorProps, setMonitorProps] = createSignal<ShowObjectProperties>({});

	setMonitorProps({
		...getObjectFields(monitor),

		kind: monitor.kind,
		bitrate: monitor.bitrate,
		jitter: monitor.jitter,
		fractionLost: monitor.fractionLost,
		getInboundRtp: getResultOrEmpty(createInboundRtpProps, monitor.getInboundRtp()),
		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, monitor.getPeerConnection())
	});

	return () => ({
		properties: monitorProps,
		cleanup: () => setMonitorProps({})
	});
}

function createMediaPlayoutArrayProps(monitors: MediaPlayoutMonitor[]): ShowObjectAccessorArrayItem[] {
	return monitors.map((monitor) => {
		return {
			key: monitor.id,
			accessor: createMediaPlayoutProps(monitor)
		};
	});
}

function createMediaPlayoutProps(monitor: MediaPlayoutMonitor): ShowObjectAccessor {
	const [monitorProps, setMonitorProps] = createSignal<ShowObjectProperties>({});

	setMonitorProps({
		...getObjectFields(monitor, 'visited'),

		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, monitor.getPeerConnection())
	});

	return () => ({
		properties: monitorProps,
		cleanup: () => setMonitorProps({})
	});
}
function createMediaSourceArrayProps(monitors: MediaSourceMonitor[]): ShowObjectAccessorArrayItem[] {
	return monitors.map((monitor) => {
		return {
			key: monitor.id,
			accessor: createMediaSourceProps(monitor)
		};
	});
}

function createMediaSourceProps(monitor: MediaSourceMonitor): ShowObjectAccessor {
	const [monitorProps, setMonitorProps] = createSignal<ShowObjectProperties>({});

	setMonitorProps({
		...getObjectFields(monitor, 'visited'),

		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, monitor.getPeerConnection()),
		getTrack: getResultOrEmpty(createOutboundTrackProps, monitor.getTrack())
	});

	return () => ({
		properties: monitorProps,
		cleanup: () => setMonitorProps({})
	});
}

function createOutboundRtpArrayProps(monitors: OutboundRtpMonitor[]): ShowObjectAccessorArrayItem[] {
	return monitors.map((monitor) => {
		return {
			key: monitor.id,
			accessor: createOutboundRtpProps(monitor)
		};
	});
}

function createOutboundRtpProps(monitor: OutboundRtpMonitor): ShowObjectAccessor {
	const [monitorProps, setMonitorProps] = createSignal<ShowObjectProperties>({});

	setMonitorProps({
		...getObjectFields(monitor, 'visited'),

		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, monitor.getPeerConnection()),
		getMediaSource: getResultOrEmpty(createMediaSourceProps, monitor.getMediaSource()),
		getCodec: getResultOrEmpty(createCodecProps, monitor.getCodec()),
		getTrack: getResultOrEmpty(createOutboundTrackProps, monitor.getTrack())
	});

	return () => ({
		properties: monitorProps,
		cleanup: () => setMonitorProps({})
	});
}

function createOutboundTrackArrayProps(monitors: OutboundTrackMonitor[]): ShowObjectAccessorArrayItem[] {
	return monitors.map((monitor) => {
		return {
			key: monitor.track.id,
			accessor: createOutboundTrackProps(monitor)
		};
	});
}

function createOutboundTrackProps(monitor: OutboundTrackMonitor): ShowObjectAccessor {
	const [monitorProps, setMonitorProps] = createSignal<ShowObjectProperties>({});

	setMonitorProps({
		...getObjectFields(monitor),
		score: monitor.score,
		bitrate: monitor.bitrate,
		jitter: monitor.jitter,
		fractionLost: monitor.fractionLost,
		sendingPacketRate: monitor.sendingPacketRate,
		remoteReceivedPacketRate: monitor.remoteReceivedPacketRate,

		// Get the peer connection info (relying on the MediaSourceMonitor)
		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, monitor.getPeerConnection()),

	});

	return () => ({
		properties: monitorProps,
		cleanup: () => setMonitorProps({})
	});
}

function createPeerConnectionTransportArrayProps(monitors: PeerConnectionTransportMonitor[]): ShowObjectAccessorArrayItem[] {
	return monitors.map((monitor) => {
		return {
			key: monitor.id,
			accessor: createPeerConnectionTransportProps(monitor)
		};
	});
}

function createPeerConnectionTransportProps(monitor: PeerConnectionTransportMonitor): ShowObjectAccessor {
	const [monitorProps, setMonitorProps] = createSignal<ShowObjectProperties>({});

	setMonitorProps({
		...getObjectFields(monitor, 'visited'),

		// Get peer connection info
		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, monitor.getPeerConnection()),
	});

	return () => ({
		properties: monitorProps,
		cleanup: () => setMonitorProps({})
	});
}

function createRemoteInboundRtpArrayProps(monitors: RemoteInboundRtpMonitor[]): ShowObjectAccessorArrayItem[] {
	return monitors.map((monitor) => {
		return {
			key: monitor.id,
			accessor: createRemoteInboundRtpProps(monitor)
		};
	});
}

function createRemoteInboundRtpProps(monitor: RemoteInboundRtpMonitor): ShowObjectAccessor {
	const [monitorProps, setMonitorProps] = createSignal<ShowObjectProperties>({});

	setMonitorProps({
		...getObjectFields(monitor, 'visited'),

		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, monitor.getPeerConnection()),
		getOutboundRtp: getResultOrEmpty(createOutboundRtpProps, monitor.getOutboundRtp()),
		getCodec: getResultOrEmpty(createCodecProps, monitor.getCodec()),
	});

	return () => ({
		properties: monitorProps,
		cleanup: () => setMonitorProps({})
	});
}

function createRemoteOutboundRtpArrayProps(monitors: RemoteOutboundRtpMonitor[]): ShowObjectAccessorArrayItem[] {
	return monitors.map((monitor) => {
		return {
			key: monitor.id,
			accessor: createRemoteOutboundRtpProps(monitor)
		};
	});
}

function createRemoteOutboundRtpProps(monitor: RemoteOutboundRtpMonitor): ShowObjectAccessor {
	const [monitorProps, setMonitorProps] = createSignal<ShowObjectProperties>({});

	setMonitorProps({
		...getObjectFields(monitor, 'visited'),

		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, monitor.getPeerConnection()),
		getInboundRtp: getResultOrEmpty(createInboundRtpProps, monitor.getInboundRtp()),
		getCodec: getResultOrEmpty(createCodecProps, monitor.getCodec()),
	});

	return () => ({
		properties: monitorProps,
		cleanup: () => setMonitorProps({})
	});
}
