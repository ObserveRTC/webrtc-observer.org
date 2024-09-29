import { Button } from '@suid/material';
import { createSignal, onCleanup, onMount } from 'solid-js';

export type AutoRefreshBarProps = {
	durationInS: number
	onComplete?: () => void
    paused?: () => boolean
}

export function AutoRefreshBar(props: AutoRefreshBarProps) {
	const [ progress, setProgress ] = createSignal(1);
	const [ pause, setPause ] = createSignal(props.paused?.() ?? false);
	const [ timer, setTimer ] = createSignal<ReturnType<typeof setInterval> | undefined>(undefined);
	const refresh = () => {
		props.onComplete?.();
		setProgress(props.durationInS);

		// clearInterval(timer());
		// setTimer(undefined);

	};

	onMount(() => {
		const newTimer = setInterval(() => {
			if (pause()) return;
			if (props.paused?.()) {
				return setPause(true);
			}
			const nextProgress = Math.max(progress() -1, 0);

			setProgress(nextProgress);
			
			if (nextProgress > 0) return;
			
			refresh();
		}, 1000);

		setTimer(newTimer);
	});

	onCleanup(() => {
		const activeTimer = timer();

		activeTimer && clearInterval(activeTimer);
		setTimer(undefined);
	});
	
	return (
		<div>
			{`${progress()} sec`}
			<Button
				variant='contained'
				onClick={() => refresh()}
			>{'Refresh'}
			</Button>
			<Button
				variant='contained'
				onClick={() => setPause(!pause())}
			>{`${pause() ? 'Resume' : 'Pause'}`}
			</Button>
		</div>
		
	);
}