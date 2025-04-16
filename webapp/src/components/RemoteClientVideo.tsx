import { Component, createEffect, createResource, createSignal, onCleanup, For } from 'solid-js';
import { clientStore } from '../stores/LocalClientStore';
import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableRow } from '@suid/material';
import InfoBox from './InfoBox';
import { TrackMonitor } from '@observertc/client-monitor-js';
import { DefaultScoreCalculatorSubtractions } from '@observertc/client-monitor-js/lib/scores/DefaultScoreCalculator';

const logger = console;

type HelperStruct = 
{ 
	key: string; 
	value: number | string | boolean | undefined; 
};

const RemoteClientVideo: Component<{ consumerId: string }> = (props) => {
	const [ videoAction, setVideoAction ] = createSignal<'resume' | 'pause'>('resume');
	const [ videoScoreDetails, setVideoScoreDetails ] = createSignal<{
		score: number;
		reasons?: string;
	} | undefined>();
	let mediaRef: HTMLVideoElement;
	const updateScores = () => {
		const videoTrack = (mediaRef?.srcObject as MediaStream)?.getVideoTracks()[0];
		const trackMonitor = clientStore.call?.monitor.getTrackMonitor(videoTrack?.id ?? '');

		setVideoScoreDetails({
			score: trackMonitor?.score ?? -1,
			reasons: videoScoreDetailsPopoverText(trackMonitor)
		});
	};
	const videoScoreDetailsPopoverText = (trackMonitor?: TrackMonitor): string | undefined => {
		if (!trackMonitor) return;

		const subtractions = trackMonitor.calculatedScore.reasons as DefaultScoreCalculatorSubtractions;
		const reasons = Object.keys(subtractions ?? {});

		if (reasons.length < 1) return;

		return reasons.join(', ');
	};
	createResource(videoAction, async (consumerAction) => {
		const call = clientStore.call;
		const consumer = call?.mediaConsumers.get(props.consumerId);

		if (!consumer) return logger.warn(`Consumer ${props.consumerId} not found`);

		logger.debug(`Consumer ${consumer.id} ${consumerAction}`);

		consumer[consumerAction]();
	});
	const [ properties, setProperties ] = createSignal<HelperStruct[]>([]);

	createEffect(() => {
		const call = clientStore.call;
		const consumer = call?.mediaConsumers.get(props.consumerId);

		if (!consumer) return logger.warn(`Consumer ${props.consumerId} not found`);
		
		mediaRef.srcObject = new MediaStream([ consumer.track ]);
		
		call?.monitor.on('stats-collected', updateScores);

		setProperties([
			{ key: 'clientId', value: consumer.appData.clientId },
			{ key: 'userId', value: consumer.appData.userId },
		]);
	});

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
			<Button onClick={ () => setVideoAction(videoAction() === 'pause' ? 'resume' : 'pause') }>
				{ videoAction() === 'pause' ? 'resume' : 'pause' }
			</Button>
			<TableContainer component={Paper}>
				<Table aria-label="simple table">
					<TableBody>
						<For each={properties()}>
							{(row) => (
								<TableRow
									sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
								>
									<TableCell component="th" scope="row">
										{`${row.key}`}
									</TableCell>
									<TableCell align="left">{row.value}</TableCell>
								</TableRow>
							)}
						</For>
					</TableBody>
				</Table>
			</TableContainer>
		</>
		
	);
};

export default RemoteClientVideo;
