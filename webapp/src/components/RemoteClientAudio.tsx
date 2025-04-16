import { Component, createEffect, createSignal, onCleanup } from 'solid-js';
import { clientStore } from '../stores/LocalClientStore';
import { TrackMonitor } from '@observertc/client-monitor-js';
import InfoBox from './InfoBox';

const logger = console;

const RemoteClientAudio: Component<{ consumerId: string }> = (props) => {
	let mediaRef: HTMLVideoElement;
	const [ audioScoreDetails, setAudioScoreDetails ] = createSignal<{
			score: number;
			reasons?: string;
		} | undefined>();
	const updateScores = () => {
		const audioTrack = (mediaRef?.srcObject as MediaStream)?.getAudioTracks()[0];
		const trackMonitor = clientStore.call?.monitor.getTrackMonitor(audioTrack?.id ?? '');
	
		setAudioScoreDetails({
			score: trackMonitor?.score ?? -1,
			reasons: audioScoreDetailsPopoverText(trackMonitor)
		});
	};
	const audioScoreDetailsPopoverText = (trackMonitor?: TrackMonitor): string | undefined => {
		if (!trackMonitor) return;
		return;
	};
	createEffect(() => {
		const call = clientStore.call;
		const consumer = call?.mediaConsumers.get(props.consumerId);

		if (!consumer) return logger.warn(`Consumer ${props.consumerId} not found`);
		
		mediaRef.srcObject = new MediaStream([ consumer.track ]);

		call?.monitor.on('stats-collected', updateScores);
	});

	onCleanup(() => {
		mediaRef.srcObject = null;
		mediaRef.onplay = null;
		mediaRef.onpause = null;

		clientStore.call?.monitor.off('stats-collected', updateScores);
	});

	return (
		<>
			<audio ref={ mediaRef! } autoplay />
			<InfoBox 
				popoverText={audioScoreDetails()?.reasons ?? ''}
				value={`Audio Score: ${audioScoreDetails()?.score ?? -1}`}
			/>
		</>
		
	);
};

export default RemoteClientAudio;
