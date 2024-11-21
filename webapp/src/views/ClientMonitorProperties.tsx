import { createSignal, type Component, Show } from 'solid-js';
import Section from '../components/Section';
import ClientMonitor from '../components/ClientMonitor/ClientMonitor';
import { Grid } from '@suid/material';
import { setPage } from '../signals/signals';
import { clientStore } from '../stores/LocalClientStore';



// import { setTestState } from '../signals/signals';
// import Button from '../components/Button';

// const TestResults = lazy(() => import('../components/TestResults'));

const ClientMonitorProperties: Component = () => {
	// eslint-disable-next-line no-unused-vars
	const [ error, setError ] = createSignal<string | undefined>();

	return (
		<Grid container spacing={2}>
			<Grid item xs={12}>
				<Section title={'ClientMonitor'}>
					<Show when={clientStore.call} fallback={(
						<b>Please join a call to see the ClientMonitor in action.</b>
					)}>
						<ClientMonitor />
					</Show>
				</Section>

				<Section>
					<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('main')}>Back</a>
				</Section>
				
			</Grid>
		</Grid>

		
	);

	// return (
	// 	<Grid container spacing={2}>
	// 		<Show when={error()}>
	// 			<Grid item xs={12}>
	// 				<ErrorPaperItem>{error()}</ErrorPaperItem>
	// 			</Grid>
	// 		</Show>
	// 		<Grid item xs={12}>
	// 			<Section title="ClientMonitor Properties">
	// 				<p class='text-left text-base font-sans text-gray-600 antialiased text-justify'>
	//                     ClientMonitor Properties
	// 				</p>

	// 				<ClientMonitor />
	// 			</Section>

	// 			<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('main')}>Back</a>
	// 		</Grid>
	// 	</Grid>
	// );
};

export default ClientMonitorProperties;
