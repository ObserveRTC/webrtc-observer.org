/* eslint-disable no-global-assign */
import { render } from 'solid-js/web';

import App from './App';
import './index.css';
import { updateClientMediaDevices } from './stores/LocalClientStore';
// import { createClientMonitor, TrackStats } from '@observertc/client-monitor-js';

// const dashboardClient = new clientSDK.ObserverDashboardClient({
// 	connection: {
// 		url: 'ws://localhost:8080',
// 		getAccessToken: async () => btoa(JSON.stringify({
// 			clientId: 'asasdasd',
// 		}))
// 	}
// });

// dashboardClient.connect().then(async () => {
// 	// const samples = await dashboardClient.createClientSamplesFrame({
// 	// 	callId: 'annie-hall-35427d27',
// 	// 	clientId: '78715dd3-6e01-41d4-be78-5fbd6abca3fc',
// 	// });
// 	// samples.on('newrow', (row) => {
// 	// 	console.warn('new row', row);
// 	// });

// 	dashboardClient.findCalls({
// 		callId: 'apocalypse-now-31d48f2a',
// 	});
// 	// samples.open();
// });


// shim the RTCPeerConnection with a proxy to monitor the connection
// const originalRTCPeerConnection = RTCPeerConnection;

// RTCPeerConnection = new Proxy(originalRTCPeerConnection, {
// 	construct(target, args) {
// 		const pc = new target(...args);

// 		console.warn('RTCPeerConnection shimmed', pc, args[0]);
// 		monitorPeerConnection(pc);
		
// 		return pc;
// 	}
// });

// const monitor = createClientMonitor();
// monitor.collectors.on('removed-stats-collector', (collector) => {
// 	console.debug('removed stats collector', collector.id);
// });
// monitor.collectors.on('added-stats-collector', collector => {
// 	console.debug('added stats collector', collector.id);
// });

// export function monitorPeerConnection(peerConnection: RTCPeerConnection) {
// 	const collector = monitor.collectors.addRTCPeerConnection(peerConnection);
// 	const listener = () => {
// 		if(peerConnection.connectionState === 'closed'){
// 			collector.close();
// 			return;
// 		}
// 		const pcStats = monitor.getPeerConnectionStats(collector.id);

// 		console.debug('stats data:', pcStats);
// 	};
// 	monitor.once('close', () => {
// 		monitor.off('stats-collected', listener);
// 	}); 
// 	monitor.on('stats-collected', listener);

// }

// function printTrackStats(trackStats?: TrackStats) {
// 	if (!trackStats) return;

// 	const rtpEntries = trackStats.direction === 'inbound' ? [...trackStats.inboundRtps()] : [...trackStats.outboundRtps()];
// 	const codec = rtpEntries[0]?.getCodec()?.stats.mimeType;

// 	console.log(`Track ${trackStats.trackId} stats:`, {
// 		codec,
// 		'RTT / loss': `${trackStats.roundTripTimeInS} / ${trackStats.fractionLoss}%`,
// 		bitrate: `${trackStats.bitrate / 1000} kbps`,
// 	});
// 	console.log('track stats', trackStats);
// }

// monitor.on('stats-collected', () => {
// 	for (const trackStats of monitor.tracks) {
// 		printTrackStats(trackStats);
// 	}
// });

// printTrackStats(monitor.getTrackStats('trackId'));


// initialize
navigator.mediaDevices.ondevicechange = updateClientMediaDevices;

render(() => <App />, document.getElementById('root')!);
