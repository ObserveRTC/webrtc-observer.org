/* eslint-disable no-unused-vars */
import { createSignal, onCleanup, onMount, Show } from 'solid-js';
import './style.css';

type SimpleCountdownComponentProps = {
	millis: number;
	onZero?: () => void;
};

const boxStyle = {
	'width': '60px',
	'height': '60px',
	'display': 'flex',
	'justify-content': 'center',
	'align-items': 'center',
	'font-size': '1.5rem',
	'border': '2px solid #2F97C1',
	'border-radius': '5px',
};


const SimpleCountdown = (props: SimpleCountdownComponentProps) => {
	const [secondsLeft, setSecondsLeft] = createSignal(0);
	const minutes = () => Math.floor(secondsLeft() / 60);
	const seconds = () => secondsLeft() % 60;
	const [isCounting, setIsCounting] = createSignal(false);
	const [pie, setPie] = createSignal(0);
	const [backgroundStyle, setBackgroundStyle] = createSignal<string>('');
  
	let interval: number | undefined;

	const calculatePie = (totalSec: number, currentSec: number) => {
		return 100 - (currentSec / totalSec) * 100;
	};

	const startClock = (millis: number) => {
		
		const sec = Math.floor(millis / 1000);
		setSecondsLeft(sec);
		setPie(0);
		setIsCounting(true);

		if (interval) clearInterval(interval);

		let currentSec = sec;

		interval = setInterval(() => {
			currentSec -= 1;
			setSecondsLeft(currentSec);
      
			const newPie = calculatePie(sec, currentSec);
			setPie(newPie);

			// Update background gradient style for the clock
			const half = 50;
			const increment = 360 / (100 / 1);
			const i = Math.floor(newPie) - 1;

			if (i < half) {
				const nextdeg = 90 + increment * i + 'deg';
				// setBackgroundStyle({
				// 	backgroundImage: `linear-gradient(90deg, #feeff4 50%, transparent 50%, transparent),
				//             linear-gradient(${nextdeg}, #ec366b 50%, #feeff4 50%, #feeff4)`,
				// });
				setBackgroundStyle(`
					backgroundImage: linear-gradient(90deg, #feeff4 50%, transparent 50%, transparent),
                            linear-gradient(${nextdeg}, #ec366b 50%, #feeff4 50%, #feeff4)
				`);
			} else {
				const nextdeg = -90 + increment * (i - half) + 'deg';
				// setBackgroundStyle({
				// 	backgroundImage: `linear-gradient(${nextdeg}, #ec366b 50%, transparent 50%, transparent),
				//             linear-gradient(270deg, #ec366b 50%, #feeff4 50%, #feeff4)`,
				// });
				setBackgroundStyle(`
					backgroundImage: linear-gradient(${nextdeg}, #ec366b 50%, transparent 50%, transparent),
                            linear-gradient(270deg, #ec366b 50%, #feeff4 50%, #feeff4)
				`);
			}

			if (currentSec <= 0) {
				clearInterval(interval);
				setIsCounting(false);
				setBackgroundStyle('');
				props.onZero?.();
			}
		}, 1000);
	};

	const stopClock = () => {
		if (interval) clearInterval(interval);
		setSecondsLeft(0);
		setIsCounting(false);
		setBackgroundStyle('');
	};

	onCleanup(() => {
		if (interval) clearInterval(interval);
	});

	onMount(() => {
		startClock(props.millis);
	});

	return (
		<div style={{ 'display': 'flex', 'justify-content': 'center', 'gap': '10px' }}>
			<div style={boxStyle}>{String(minutes()).padStart(2, '0')}</div>
			<div style={{ 'font-size': '1.5rem', 'align-self': 'center' }}>:</div>
			<div style={boxStyle}>{String(seconds()).padStart(2, '0')}</div>
		</div>
	);
};

export default SimpleCountdown;
