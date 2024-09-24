import { Show, createSignal, onMount, type Component } from 'solid-js';
import Box from '../Box';
import { ErrorPaperItem } from '../PaperItem';
import { clientStore } from '../../stores/LocalClientStore';


const Overview: Component = () => {
	const [ error, setError ] = createSignal<string | undefined>();

	onMount(() => {
		const clientMonitor = clientStore.call?.monitor;
		if (!clientMonitor) return;
		clientMonitor.on('error', (e) => setError(`${e}`));
		clientMonitor.totalAvailableIncomingBitrate;
	});
	return (
		<Box title='Overview' full={true}>
			<Show when={error()}>
				<ErrorPaperItem>{error()}</ErrorPaperItem>
			</Show>
		</Box>
	);
};

export default Overview;
