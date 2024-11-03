import { createSignal, Show, type Component, For } from 'solid-js';
import { Grid } from '@suid/material';
import Section from '../components/Section';
import { setPage } from '../signals/signals';
import { clientStore } from '../stores/LocalClientStore';
import JSONFormatter from 'json-formatter-js';

// import { setTestState } from '../signals/signals';
// import Button from '../components/Button';

// const TestResults = lazy(() => import('../components/TestResults'));

const IceConnectionPage: Component = () => {
	// eslint-disable-next-line no-unused-vars
	const [ error, setError ] = createSignal<string | undefined>();

	// clientStore.call?.monitor.

	return (
		<Grid container spacing={2}>
			<Grid item xs={12}>
				<Section title="ICE Connection">
                    ICE connection details
					
				</Section>

				<Show when={clientStore.call?.monitor} fallback={(
					<div class='flex flex-col bg-white p-4 gap-2 mt-8 mx-4 sm:mx-auto max-w-4xl'>
						<b>Please join a call to see the ICE connection details.</b>
					</div>
				)} keyed>{(monitor) => {

						return (
							<For each={monitor.peerConnections}>{pc => {
								console.warn('monitor', pc.iceCandidatePairs());
								
								return (
									<Section title={`PeerConnection (${pc.label})`}>
										{new JSONFormatter(pc.getSelectedIceCandidatePair()).render()}
									</Section>
								);}}
								

							</For>
						);
					}}
						
				</Show>
					
				<Section>
					<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('main')}>Back</a>
				</Section>
				
			</Grid>
		</Grid>
	);
};

export default IceConnectionPage;
