import { Component, createEffect, createResource, createSignal, onCleanup, Show } from 'solid-js';
import { clientStore } from '../stores/LocalClientStore';
import { Button } from '@suid/material';
import InfoBox from './InfoBox';
import { DefaultScoreCalculatorSubtractions } from '@observertc/client-monitor-js/lib/scores/DefaultScoreCalculator';

const LocalClientVideo: Component<{showControls?: boolean}> = (props) => {
	let mediaRef: HTMLVideoElement;
	const [ videoAction, setVideoAction ] = createSignal<'resume' | 'pause'>('resume');
	const [ audioAction, setAudioAction ] = createSignal<'enable' | 'disable'>('disable');
	const [ videoScoreDetails, setVideoScoreDetails ] = createSignal<{
		score: number;
		reasons?: string;
	} | undefined>();
	const [ audioScoreDetails, setAudioScoreDetails ] = createSignal<{
		score: number;
		reasons?: string;
	} | undefined>();
	createResource(videoAction, async (producerAction) => {
		const call = clientStore.call;
		const producers = [...(call?.mediaProducers.values() ?? [])].filter((producer) => producer.kind === 'video');

		if (!producers || producers.length < 1) return;

		producers.forEach(producer => producer[producerAction]());
	});

	createResource(audioAction, async (producerAction) => {
		const call = clientStore.call;
		const producers = [...(call?.mediaProducers.values() ?? [])].filter((producer) => producer.kind === 'audio');

		if (!producers || producers.length < 1) return;

		producers.forEach(producer => producerAction === 'enable' ? producer.resume() : producer.pause());
	});

	const updateScores = () => {
		const videoTrack = clientStore.mediaStream?.getVideoTracks()[0];
		const trackMonitor = clientStore.call?.monitor.getTrackMonitor(videoTrack?.id ?? '');
		setVideoScoreDetails({
			score: trackMonitor?.score ?? -1,
			reasons: videoScoreDetailsPopoverText()
		});
		const audioTrack = clientStore.mediaStream?.getAudioTracks()[0];
		const audioTrackMonitor = clientStore.call?.monitor.getTrackMonitor(audioTrack?.id ?? '');
		setAudioScoreDetails({
			score: audioTrackMonitor?.score ?? -1,
			reasons: audioScoreDetailsPopoverText()
		});
		return trackMonitor?.calculatedScore;
	};
	
	createEffect(() => {
		if (!clientStore.mediaStream) return;

		mediaRef.srcObject = clientStore.mediaStream;
		clientStore.call?.monitor.on('stats-collected', updateScores);
	});

	const videoScoreDetailsPopoverText = (): string | undefined => {
		const videoTrack = clientStore.mediaStream?.getVideoTracks()[0];
		const trackMonitor = clientStore.call?.monitor.getTrackMonitor(videoTrack?.id ?? '');
		const calculatedScore = trackMonitor?.calculatedScore;
		const subtractions = calculatedScore?.reasons as DefaultScoreCalculatorSubtractions;
		const reasons = Object.keys(subtractions ?? {});

		if (reasons.length === 0) {
			return undefined;
		}
		return reasons.join(', ');
	};

	const audioScoreDetailsPopoverText = (): string | undefined => {
		const videoTrack = clientStore.mediaStream?.getAudioTracks()[0];
		const trackMonitor = clientStore.call?.monitor.getTrackMonitor(videoTrack?.id ?? '');
		const calculatedScore = trackMonitor?.calculatedScore;

		return calculatedScore?.appData ? 'Audio score details' : undefined;
	};

	onCleanup(() => {
		mediaRef.srcObject = null;
		mediaRef.onplay = null;
		mediaRef.onpause = null;

		clientStore.call?.monitor.off('stats-collected', updateScores);
	});

	return (
		<>
			<video ref={ mediaRef! } class='w-full aspect-[16/9] rounded-lg overflow-hidden shadow-sm' autoplay playsinline muted />
			<InfoBox 
				popoverText={videoScoreDetails()?.reasons ?? ''}
				value={`Video Score: ${videoScoreDetails()?.score ?? -1}`}
			/>
			<InfoBox 
				popoverText={audioScoreDetails()?.reasons ?? ''}
				value={`Audio Score: ${audioScoreDetails()?.score ?? -1}`}
			/>
			<Show when={props.showControls}>
				<Button onClick={ () => setVideoAction(videoAction() === 'pause' ? 'resume' : 'pause') }>
					{ videoAction() === 'pause' ? 'resume' : 'pause' }
				</Button>
				<Button onClick={ () => setAudioAction(audioAction() === 'enable' ? 'disable' : 'enable') }>
					{ (audioAction() === 'enable' ? 'disable' : 'enable').concat(' mic') }
				</Button>
				<Button onClick={ () => clientStore.call?.close() }>
					Close
				</Button>
			</Show>
		</>
		
	);
};

export default LocalClientVideo;
