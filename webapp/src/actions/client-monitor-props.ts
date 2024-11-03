import {
	CertificateEntry,
	ClientMonitor,
	CodecEntry,
	ContributingSourceEntry,
	DataChannelEntry,
	IceCandidatePairEntry,
	IceServerEntry,
	InboundRtpEntry,
	MediaSourceEntry,
	OutboundRtpEntry,
	PeerConnectionEntry,
	RemoteInboundRtpEntry,
	RemoteOutboundRtpEntry,
	SctpTransportEntry,
	SenderEntry,
	TransceiverEntry,
	TransportEntry,
} from '@observertc/client-monitor-js';
  
import { 
	ShowObjectProps, 
	ShowObjectAccessorArrayItem, 
	ShowObjectAccessor, 
	ShowObjectProperties
} from '../components/ClientMonitor/ShowObject';
import { createSignal } from 'solid-js';
import { AudioPlayoutEntry, LocalCandidateEntry, ReceiverEntry, RemoteCandidateEntry } from '@observertc/client-monitor-js/lib/entries/StatsEntryInterfaces';

// eslint-disable-next-line no-unused-vars
function getResultOrEmpty<T>(accessor: (i: T) => ShowObjectAccessor, value?: T): ShowObjectAccessor {
	if (value) return accessor(value);

	const [result] = createSignal<ShowObjectProperties>({});
	
	return () => ({
		properties: result,
		cleanup: () => {}
	});
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
			browser: monitor.browser,
			operatingSystem: monitor.operationSystem,
			engine: monitor.engine,
			platform: monitor.platform,
			created: monitor.created,
			sendingAudioBitrate: monitor.sendingAudioBitrate,
			sendingVideoBitrate: monitor.sendingVideoBitrate,
			receivingAudioBitrate: monitor.receivingAudioBitrate,
			receivingVideoBitrate: monitor.receivingVideoBitrate,

			totalInboundPacketsLost: monitor.totalInboundPacketsLost,
			totalInboundPacketsReceived: monitor.totalInboundPacketsReceived,
			totalOutboundPacketsSent: monitor.totalOutboundPacketsSent,
			totalOutboundPacketsReceived: monitor.totalOutboundPacketsReceived,
			totalOutboundPacketsLost: monitor.totalOutboundPacketsLost,
			totalDataChannelBytesSent: monitor.totalDataChannelBytesSent,
			totalDataChannelBytesReceived: monitor.totalDataChannelBytesReceived,
			totalSentAudioBytes: monitor.totalSentAudioBytes,
			totalSentVideoBytes: monitor.totalSentVideoBytes,
			totalReceivedAudioBytes: monitor.totalReceivedAudioBytes,
			totalReceivedVideoBytes: monitor.totalReceivedVideoBytes,
			totalAvailableIncomingBitrate: monitor.totalAvailableIncomingBitrate,
			totalAvailableOutgoingBitrate: monitor.totalAvailableOutgoingBitrate,


			deltaInboundPacketsLost: monitor.deltaInboundPacketsLost,
			deltaInboundPacketsReceived: monitor.deltaInboundPacketsReceived,
			deltaOutboundPacketsSent: monitor.deltaOutboundPacketsSent,
			deltaOutboundPacketsReceived: monitor.deltaOutboundPacketsReceived,
			deltaOutboundPacketsLost: monitor.deltaOutboundPacketsLost,
			deltaDataChannelBytesSent: monitor.deltaDataChannelBytesSent,
			deltaDataChannelBytesReceived: monitor.deltaDataChannelBytesReceived,
			deltaSentAudioBytes: monitor.deltaSentAudioBytes,
			deltaSentVideoBytes: monitor.deltaSentVideoBytes,
			deltaReceivedAudioBytes: monitor.deltaReceivedAudioBytes,
			deltaReceivedVideoBytes: monitor.deltaReceivedVideoBytes,

			avgRttInSec: monitor.avgRttInSec,
			highestSeenSendingBitrate: monitor.highestSeenSendingBitrate,
			highestSeenReceivingBitrate: monitor.highestSeenReceivingBitrate,
			highestSeenAvailableOutgoingBitrate: monitor.highestSeenAvailableOutgoingBitrate,
			highestSeenAvailableIncomingBitrate: monitor.highestSeenAvailableIncomingBitrate,
			sendingFractionLost: monitor.sendingFractionLost,
			receivingFractionLost: monitor.receivingFractionLost,

			// func: () => createPeerConnectionProps(monitor.peerConnections[0]),
			
			codecs: createCodecArrayProps(monitor.codecs),
			inboundRtps: createInboundRtpArrayProps(monitor.inboundRtps),
			outboundRtps: createOutboundRtpArrayProps(monitor.outboundRtps),
			// remoteInboundRtps: createRemoteInboundRtpArrayProps(monitor.remoteInboundRtps),
			// remoteOutboundRtps: createRemoteOutboundRtpArrayProps(monitor.remoteOutboundRtps),
			// mediaSources: createMediaSourceArrayProps(monitor.mediaSources),
			// dataChannels: createDataChannelArrayProps(monitor.dataChannels),
			// transports: createTransportArrayProps(monitor.transports),
			// iceCandidatePairs: createIceCandidatePairArrayProps(monitor.iceCandidatePairs),
			// iceLocalCandidates: createIceLocalCandidateArrayProps(monitor.iceLocalCandidates),
			// iceRemoteCandidates: createIceRemoteCandidateArrayProps(monitor.iceRemoteCandidates),
			// transceivers: createTransceiverArrayProps(monitor.transceivers),
			// senders: createSenderArrayProps(monitor.senders),
			// sctpTransports: createSctpTransportsArratProps(monitor.sctpTransports),
			// certificates: createCertificateArrayProps(monitor.certificates),
			// iceServers: createIceServerArrayProps(monitor.iceServers),
			// contributingSources: createContributingSourcesArrayProps(monitor.contributingSources),
			// receivers: createReceiverArrayProps(monitor.receivers),
			// audioPlayouts: createAudioPlayoutArrayProps(monitor.audioPlayouts),
            
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

function createPeerConnectionArrayProps(peerConnections: PeerConnectionEntry[]): ShowObjectAccessorArrayItem[] {
	return peerConnections.map((pc) => {
		return {
			key: pc.peerConnectionId,
			accessor: createPeerConnectionProps(pc)
		};
	});
}

function createPeerConnectionProps(peerConnection: PeerConnectionEntry): ShowObjectAccessor {
	const [peerConnectionProps, setPeerConnectionProps] = createSignal<ShowObjectProperties>({});

	// const codecs = [...peerConnection.codecs()];

	// console.warn('codecs', codecs);

	setPeerConnectionProps({
		peerConnectionId: peerConnection.peerConnectionId,
		statsId: peerConnection.statsId,
		label: peerConnection.label,
		usingTCP: peerConnection.usingTCP,
		usingTURN: peerConnection.usingTURN,

		totalInboundPacketsLost: peerConnection.totalInboundPacketsLost,
		totalInboundPacketsReceived: peerConnection.totalInboundPacketsReceived,
		totalOutboundPacketsLost: peerConnection.totalOutboundPacketsLost,
		totalOutboundPacketsReceived: peerConnection.totalOutboundPacketsReceived,
		totalOutboundPacketsSent: peerConnection.totalOutboundPacketsSent,
		totalSentAudioBytes: peerConnection.totalSentAudioBytes,
		totalSentVideoBytes: peerConnection.totalSentVideoBytes,
		totalReceivedAudioBytes: peerConnection.totalReceivedAudioBytes,
		totalReceivedVideoBytes: peerConnection.totalReceivedVideoBytes,
		totalDataChannelBytesReceived: peerConnection.totalDataChannelBytesReceived,
		totalDataChannelBytesSent: peerConnection.totalDataChannelBytesSent,

		deltaInboundPacketsLost: peerConnection.deltaInboundPacketsLost,
		deltaInboundPacketsReceived: peerConnection.deltaInboundPacketsReceived,
		deltaOutboundPacketsLost: peerConnection.deltaOutboundPacketsLost,
		deltaOutboundPacketsReceived: peerConnection.deltaOutboundPacketsReceived,
		deltaOutboundPacketsSent: peerConnection.deltaOutboundPacketsSent,
		deltaSentAudioBytes: peerConnection.deltaSentAudioBytes,
		deltaSentVideoBytes: peerConnection.deltaSentVideoBytes,
		deltaReceivedAudioBytes: peerConnection.deltaReceivedAudioBytes,
		deltaReceivedVideoBytes: peerConnection.deltaReceivedVideoBytes,
		deltaDataChannelBytesSent: peerConnection.deltaDataChannelBytesSent,
		deltaDataChannelBytesReceived: peerConnection.deltaDataChannelBytesReceived,
		avgRttInS: peerConnection.avgRttInS,

		sendingAudioBitrate: peerConnection.sendingAudioBitrate,
		sendingVideoBitrate: peerConnection.sendingVideoBitrate,
		sendingFractionalLoss: peerConnection.sendingFractionalLoss,
		receivingAudioBitrate: peerConnection.receivingAudioBitrate,
		receivingVideoBitrate: peerConnection.receivingVideoBitrate,
		receivingFractionalLoss: peerConnection.receivingFractionalLoss,

		connectionState: peerConnection.connectionState,
		connectionEstablishedDurationInMs:  peerConnection.connectionEstablishedDurationInMs,


		// 'codecs': createCodecArrayProps([...peerConnection.codecs()]),
		// 'inboundRtps()': createInboundRtpArrayProps([...peerConnection.inboundRtps()]),
		// 'outboundRtps()': createOutboundRtpArrayProps([...peerConnection.outboundRtps()]),
		// 'remoteInboundRtps()': createRemoteInboundRtpArrayProps([...peerConnection.remoteInboundRtps()]),
		// 'remoteOutboundRtps()': createRemoteOutboundRtpArrayProps([...peerConnection.remoteOutboundRtps()]),
		// 'mediaSources()': createMediaSourceArrayProps([...peerConnection.mediaSources()]),
		// 'dataChannels()': createDataChannelArrayProps([...peerConnection.dataChannels()]),
		// 'transports()': createTransportArrayProps([...peerConnection.transports()]),
		// 'iceCandidatePairs()': createIceCandidatePairArrayProps([...peerConnection.iceCandidatePairs()]),
		// 'transceivers()': createTransceiverArrayProps([...peerConnection.transceivers()]),
		// 'senders()': createSenderArrayProps([...peerConnection.senders()]),
		// 'sctpTransports()': createSctpTransportsArratProps([...peerConnection.sctpTransports()]),
		// 'certificates()': createCertificateArrayProps([...peerConnection.certificates()]),
		// 'iceServers()': createIceServerArrayProps([...peerConnection.iceServers()]),
		// 'contributingSources()': createContributingSourcesArrayProps([...peerConnection.contributingSources()]),
		// 'receivers()': createReceiverArrayProps([...peerConnection.receivers()]),
		// 'audioPlayouts()': createAudioPlayoutArrayProps([...peerConnection.audioPlayouts()]),
		
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


function createCodecArrayProps(codecs: CodecEntry[]): ShowObjectAccessorArrayItem[] {
	return codecs.map((codec) => {
		return {
			key: codec.statsId,
			accessor: createCodecProps(codec)
		};
	});
}

function createCodecProps(codec: CodecEntry): ShowObjectAccessor {
	const [codecsProps, setCodecsProps] = createSignal<ShowObjectProperties>({});

	setCodecsProps({
		stats: codec.stats,

		getTransport: getResultOrEmpty(createTransportProps, codec.getTransport()),
		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, codec.getPeerConnection())
	});

	return () => ({
		properties: codecsProps,
		cleanup: () => setCodecsProps({})
	});
}

function createInboundRtpArrayProps(inboundRtps: InboundRtpEntry[]): ShowObjectAccessorArrayItem[] {
	return inboundRtps.map((inboundRtp) => {
		return {
			key: inboundRtp.statsId,
			accessor: createInboundRtpProps(inboundRtp)
		};
	});
}

function createInboundRtpProps(inboundRtp: InboundRtpEntry): ShowObjectAccessor {
	const [inboundRtpProps, setInboundRtpProps] = createSignal<ShowObjectProperties>({});

	setInboundRtpProps({

		kind: inboundRtp.kind,
		expectedFrameRate: inboundRtp.expectedFrameRate,
		sfuStreamId: inboundRtp.sfuStreamId,
		sfuSinkId: inboundRtp.sfuSinkId,
		remoteClientId: inboundRtp.remoteClientId,
		score: inboundRtp.score,
		avgJitterBufferDelayInMs: inboundRtp.avgJitterBufferDelayInMs,
		receivingBitrate: inboundRtp.receivingBitrate,
		receivedBytes: inboundRtp.receivedBytes,
		lostPackets: inboundRtp.lostPackets,
		receivedPackets: inboundRtp.receivedPackets,
		receivedFrames: inboundRtp.receivedFrames,
		decodedFrames: inboundRtp.decodedFrames,
		droppedFrames: inboundRtp.droppedFrames,
		receivedSamples: inboundRtp.receivedSamples,
		silentConcealedSamples: inboundRtp.silentConcealedSamples,
		fractionLoss: inboundRtp.fractionLoss,
		avgRttInS: inboundRtp.avgRttInS,
		framesPerSecond: inboundRtp.framesPerSecond,
		fpsVolatility: inboundRtp.fpsVolatility,
		avgFramesPerSec: inboundRtp.avgFramesPerSec,
		lastNFramesPerSec: inboundRtp.lastNFramesPerSec,
		
		getAudioPlayout: getResultOrEmpty(createAudioPlayoutProps, inboundRtp.getAudioPlayout()),
		getCodec: getResultOrEmpty(createCodecProps, inboundRtp.getCodec()),
		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, inboundRtp.getPeerConnection()),
		getReceiver: getResultOrEmpty(createReceiverProps, inboundRtp.getReceiver()),
		getRemoteOutboundRtp: getResultOrEmpty(createRemoteOutboundRtpProps, inboundRtp.getRemoteOutboundRtp()),
		getSsrc: getResultOrEmpty(getPrimitiveProps, inboundRtp.getSsrc()),
		getTrackId: getResultOrEmpty(getPrimitiveProps, inboundRtp.getTrackId()),
		getTransport: getResultOrEmpty(createTransportProps, inboundRtp.getTransport()),

		stats: inboundRtp.stats
	});

	return () => ({
		properties: inboundRtpProps,
		cleanup: () => setInboundRtpProps({})
	});
}

function createOutboundRtpArrayProps(outboundRtps: OutboundRtpEntry[]): ShowObjectAccessorArrayItem[] {
	return outboundRtps.map((outboundRtp) => {
		return {
			key: outboundRtp.statsId,
			accessor: createOutboundRtpProps(outboundRtp)
		};
	});
}

function createOutboundRtpProps(outboundRtp: OutboundRtpEntry): ShowObjectAccessor {
	const [outboundRtpProps, setOutboundRtpProps] = createSignal<ShowObjectProperties>({});
	
	setOutboundRtpProps({
		kind: outboundRtp.kind,
		sfuStreamId: outboundRtp.sfuStreamId,
		score: outboundRtp.score,
		sendingBitrate: outboundRtp.sendingBitrate,
		sentBytes: outboundRtp.sentBytes,
		sentPackets: outboundRtp.sentPackets,

		// getCodec: getResultOrEmpty(createCodecProps, outboundRtp.getCodec()),
		// getMediaSource: getResultOrEmpty(createMediaSourceProps, outboundRtp.getMediaSource()),
		// getPeerConnection: getResultOrEmpty(createPeerConnectionProps, outboundRtp.getPeerConnection()),
		// getRemoteInboundRtp: getResultOrEmpty(createRemoteInboundRtpProps, outboundRtp.getRemoteInboundRtp()),
		// getSender: getResultOrEmpty(createSenderProps, outboundRtp.getSender()),
		// getSsrc: getResultOrEmpty(getPrimitiveProps, outboundRtp.getSsrc()),
		// getTrackId: getResultOrEmpty(getPrimitiveProps, outboundRtp.getTrackId()),
		// getTransport: getResultOrEmpty(createTransportProps, outboundRtp.getTransport()),

		stats: outboundRtp.stats
	});

	return () => ({
		properties: outboundRtpProps,
		cleanup: () => setOutboundRtpProps({})
	});
}


function createRemoteInboundRtpArrayProps(remoteInboundRtps: RemoteInboundRtpEntry[]): ShowObjectAccessorArrayItem[] {
	return remoteInboundRtps.map((remoteInboundRtp) => {
		return {
			key: remoteInboundRtp.statsId,
			accessor: createRemoteInboundRtpProps(remoteInboundRtp)
		};
	});
}

function createRemoteInboundRtpProps(remoteInboundRtp: RemoteInboundRtpEntry): ShowObjectAccessor {
	const [remoteInboundRtpProps, setRemoteInboundRtpProps] = createSignal<ShowObjectProperties>({});

	setRemoteInboundRtpProps({
		receivedPackets: remoteInboundRtp.receivedPackets,
		lostPackets: remoteInboundRtp.lostPackets,
			
		getCodec: getResultOrEmpty(createCodecProps, remoteInboundRtp.getCodec()),
		getOutboundRtp: getResultOrEmpty(createOutboundRtpProps, remoteInboundRtp.getOutboundRtp()),
		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, remoteInboundRtp.getPeerConnection()),
		getSsrc: getResultOrEmpty(getPrimitiveProps, remoteInboundRtp.getSsrc()),
		getTransport: getResultOrEmpty(createTransportProps, remoteInboundRtp.getTransport()),

		stats: remoteInboundRtp.stats
	});

	return () => ({
		properties: remoteInboundRtpProps,
		cleanup: () => setRemoteInboundRtpProps({})
	});
}

function createRemoteOutboundRtpArrayProps(remoteOutboundRtps: RemoteOutboundRtpEntry[]): ShowObjectAccessorArrayItem[] {
	return remoteOutboundRtps.map((remoteOutboundRtp) => {
		return {
			key: remoteOutboundRtp.statsId,
			accessor: createRemoteOutboundRtpProps(remoteOutboundRtp)
		};
	});
}

function createRemoteOutboundRtpProps(remoteOutboundRtp: RemoteOutboundRtpEntry): ShowObjectAccessor {
	const [remoteOutboundRtpProps, setRemoteOutboundRtpProps] = createSignal<ShowObjectProperties>({});
	
	setRemoteOutboundRtpProps({
		getCodec: getResultOrEmpty(createCodecProps, remoteOutboundRtp.getCodec()),
		getInboundRtp: getResultOrEmpty(createInboundRtpProps, remoteOutboundRtp.getInboundRtp()),
		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, remoteOutboundRtp.getPeerConnection()),
		getSsrc: getResultOrEmpty(getPrimitiveProps, remoteOutboundRtp.getSsrc()),
		getTransport: getResultOrEmpty(createTransportProps, remoteOutboundRtp.getTransport()),

		stats: remoteOutboundRtp.stats,
	});

	return () => ({
		properties: remoteOutboundRtpProps,
		cleanup: () => setRemoteOutboundRtpProps({})
	});
}

function createMediaSourceArrayProps(mediaSources: MediaSourceEntry[]): ShowObjectAccessorArrayItem[] {
	return mediaSources.map((mediaSource) => {
		return {
			key: mediaSource.statsId,
			accessor: createMediaSourceProps(mediaSource)
		};
	});
}

function createMediaSourceProps(mediaSource: MediaSourceEntry): ShowObjectAccessor {
	const [mediaSourceProps, setMediaSourceProps] = createSignal<ShowObjectProperties>({});

	setMediaSourceProps({
		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, mediaSource.getPeerConnection()),

		stats: mediaSource.stats
	});

	return () => ({
		properties: mediaSourceProps,
		cleanup: () => setMediaSourceProps({})
	});
}

function createDataChannelArrayProps(dataChannels: DataChannelEntry[]): ShowObjectAccessorArrayItem[] {
	return dataChannels.map((dataChannel) => {
		return {
			key: dataChannel.statsId,
			accessor: createDataChannelProps(dataChannel)
		};
	});
}

function createDataChannelProps(dataChannel: DataChannelEntry): ShowObjectAccessor {
	const [dataChannelProps, setDataChannelProps] = createSignal<ShowObjectProperties>({});

	setDataChannelProps({
		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, dataChannel.getPeerConnection()),

		stats: dataChannel.stats
	});

	return () => ({
		properties: dataChannelProps,
		cleanup: () => setDataChannelProps({})
	});
}

function createTransportArrayProps(transports: TransportEntry[]): ShowObjectAccessorArrayItem[] {
	return transports.map((transport) => {
		return {
			key: transport.statsId,
			accessor: createTransportProps(transport)
		};
	});
}

function createTransportProps(transport: TransportEntry): ShowObjectAccessor {
	const [transportProps, setTransportProps] = createSignal<ShowObjectProperties>({});

	setTransportProps({
		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, transport.getPeerConnection()),

		stats: transport.stats
	});

	return () => ({
		properties: transportProps,
		cleanup: () => setTransportProps({})
	});
}

function createIceCandidatePairArrayProps(iceCandidatePairs: IceCandidatePairEntry[]): ShowObjectAccessorArrayItem[] {
	return iceCandidatePairs.map((iceCandidatePair) => {
		return {
			key: iceCandidatePair.statsId,
			accessor: createIceCandidatePairProps(iceCandidatePair)
		};
	});
}

function createIceCandidatePairProps(iceCandidatePair: IceCandidatePairEntry): ShowObjectAccessor {
	const [iceCandidatePairProps, setIceCandidatePairProps] = createSignal<ShowObjectProperties>({});

	setIceCandidatePairProps({

		getLocalCandidate: getResultOrEmpty(createIceLocalCandidateProps, iceCandidatePair.getLocalCandidate()),
		getRemoteCandidate: getResultOrEmpty(createIceRemoteCandidateProps, iceCandidatePair.getRemoteCandidate()),
		getTransport: getResultOrEmpty(createTransportProps, iceCandidatePair.getTransport()),
		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, iceCandidatePair.getPeerConnection()),
		
		stats: iceCandidatePair.stats
	});

	return () => ({
		properties: iceCandidatePairProps,
		cleanup: () => setIceCandidatePairProps({})
	});
}

function createIceLocalCandidateArrayProps(iceLocalCandidates: LocalCandidateEntry[]): ShowObjectAccessorArrayItem[] {
	return iceLocalCandidates.map((iceLocalCandidate) => {
		return {
			key: iceLocalCandidate.statsId,
			accessor: createIceLocalCandidateProps(iceLocalCandidate)
		};
	});
}

function createIceLocalCandidateProps(iceLocalCandidate: LocalCandidateEntry): ShowObjectAccessor {
	const [iceLocalCandidateProps, setIceLocalCandidateProps] = createSignal<ShowObjectProperties>({});

	setIceLocalCandidateProps({

		getTransport: getResultOrEmpty(createTransportProps, iceLocalCandidate.getTransport()),
		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, iceLocalCandidate.getPeerConnection()),

		stats: iceLocalCandidate.stats
	});

	return () => ({
		properties: iceLocalCandidateProps,
		cleanup: () => setIceLocalCandidateProps({})
	});
}

function createIceRemoteCandidateArrayProps(iceRemoteCandidates: RemoteCandidateEntry[]): ShowObjectAccessorArrayItem[] {
	return iceRemoteCandidates.map((iceRemoteCandidate) => {
		return {
			key: iceRemoteCandidate.statsId,
			accessor: createIceRemoteCandidateProps(iceRemoteCandidate)
		};
	});
}

function createIceRemoteCandidateProps(iceRemoteCandidate: RemoteCandidateEntry): ShowObjectAccessor {
	const [iceRemoteCandidateProps, setIceRemoteCandidateProps] = createSignal<ShowObjectProperties>({});

	setIceRemoteCandidateProps({

		getTransport: getResultOrEmpty(createTransportProps, iceRemoteCandidate.getTransport()),
		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, iceRemoteCandidate.getPeerConnection()),

		stats: iceRemoteCandidate.stats
	});

	return () => ({
		properties: iceRemoteCandidateProps,
		cleanup: () => setIceRemoteCandidateProps({})
	});
}

function createTransceiverArrayProps(transceivers: TransceiverEntry[]): ShowObjectAccessorArrayItem[] {
	return transceivers.map((transceiver) => {
		return {
			key: transceiver.statsId,
			accessor: createTransceieverProps(transceiver)
		};
	});
}

function createTransceieverProps(transceiever: TransceiverEntry): ShowObjectAccessor {
	const [transceieverProps, setTransceieverProps] = createSignal<ShowObjectProperties>({});

	setTransceieverProps({

		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, transceiever.getPeerConnection()),
		getReceiver: getResultOrEmpty(createReceiverProps, transceiever.getReceiver()),
		getSender: getResultOrEmpty(createSenderProps, transceiever.getSender()),

		stats: transceiever.stats
	});

	return () => ({
		properties: transceieverProps,
		cleanup: () => setTransceieverProps({})
	});
}

function createSenderArrayProps(senders: SenderEntry[]): ShowObjectAccessorArrayItem[] {
	return senders.map((sender) => {
		return {
			key: sender.statsId,
			accessor: createSenderProps(sender)
		};
	});
}

function createSenderProps(sender: SenderEntry): ShowObjectAccessor {
	const [senderProps, setSenderProps] = createSignal<ShowObjectProperties>({});

	setSenderProps({

		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, sender.getPeerConnection()),
		
		stats: sender.stats
	});

	return () => ({
		properties: senderProps,
		cleanup: () => setSenderProps({})
	});
}

function createSctpTransportsArratProps(sctpTransports: SctpTransportEntry[]): ShowObjectAccessorArrayItem[] {
	return sctpTransports.map((transport) => {
		return {
			key: transport.statsId,
			accessor: createSctpTransportProps(transport)
		};
	});
}

function createSctpTransportProps(sctpTransport: SctpTransportEntry): ShowObjectAccessor {
	const [sctpTransportProps, setSctpTransportProps] = createSignal<ShowObjectProperties>({});

	setSctpTransportProps({

		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, sctpTransport.getPeerConnection()),

		stats: sctpTransport.stats
	});

	return () => ({
		properties: sctpTransportProps,
		cleanup: () => setSctpTransportProps({})
	});
}

function createCertificateArrayProps(certificates: CertificateEntry[]): ShowObjectAccessorArrayItem[] {
	return certificates.map((certificate) => {
		return {
			key: certificate.statsId,
			accessor: createCertificateProps(certificate)
		};
	});
}

function createCertificateProps(certificate: CertificateEntry): ShowObjectAccessor {
	const [certificateProps, setCertificateProps] = createSignal<ShowObjectProperties>({});

	setCertificateProps({

		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, certificate.getPeerConnection()),

		stats: certificate.stats
	});

	return () => ({
		properties: certificateProps,
		cleanup: () => setCertificateProps({})
	});
}

function createIceServerArrayProps(iceServers: IceServerEntry[]): ShowObjectAccessorArrayItem[] {
	return iceServers.map((iceServer) => {
		return {
			key: iceServer.statsId,
			accessor: createIceServerProps(iceServer)
		};
	});
}

function createIceServerProps(iceServer: IceServerEntry): ShowObjectAccessor {
	const [iceServerProps, setIceServerProps] = createSignal<ShowObjectProperties>({});

	setIceServerProps({

		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, iceServer.getPeerConnection()),

		stats: iceServer.stats
	});

	return () => ({
		properties: iceServerProps,
		cleanup: () => setIceServerProps({})
	});
}

function createContributingSourcesArrayProps(contributingSources: ContributingSourceEntry[]): ShowObjectAccessorArrayItem[] {
	return contributingSources.map((contributingSource) => {
		return {
			key: contributingSource.statsId,
			accessor: createContributingSourcesProps(contributingSource)
		};
	});
}

function createContributingSourcesProps(contributingSources: ContributingSourceEntry): ShowObjectAccessor {
	const [contributingSourcesProps, setContributingSourcesProps] = createSignal<ShowObjectProperties>({});

	setContributingSourcesProps({

		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, contributingSources.getPeerConnection()),

		stats: contributingSources.stats
	});

	return () => ({
		properties: contributingSourcesProps,
		cleanup: () => setContributingSourcesProps({})
	});
}

function createAudioPlayoutArrayProps(audioPlayouts: AudioPlayoutEntry[]): ShowObjectAccessorArrayItem[] {
	return audioPlayouts.map((audioPlayout) => {
		return {
			key: audioPlayout.statsId,
			accessor: createAudioPlayoutProps(audioPlayout)
		};
	});
}

function createAudioPlayoutProps(audioPlayout: AudioPlayoutEntry): ShowObjectAccessor {
	const [audioPlayoutProps, setAudioPlayoutProps] = createSignal<ShowObjectProperties>({});

	setAudioPlayoutProps({

		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, audioPlayout.getPeerConnection()),

		stats: audioPlayout
	});

	return () => ({
		properties: audioPlayoutProps,
		cleanup: () => setAudioPlayoutProps({})
	});
}

function createReceiverArrayProps(receivers: ReceiverEntry[]): ShowObjectAccessorArrayItem[] {
	return receivers.map((receiver) => {
		return {
			key: receiver.statsId,
			accessor: createReceiverProps(receiver)
		};
	});
}

function createReceiverProps(receiver: ReceiverEntry): ShowObjectAccessor {
	const [receiverProps, setReceiverProps] = createSignal<ShowObjectProperties>({});

	setReceiverProps({

		getPeerConnection: getResultOrEmpty(createPeerConnectionProps, receiver.getPeerConnection()),

		stats: receiver.stats,
	});

	return () => ({
		properties: receiverProps,
		cleanup: () => setReceiverProps({})
	});
}