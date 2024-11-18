import { Show, createSignal, onCleanup, onMount, type Component } from 'solid-js';
import { ErrorPaperItem } from '../components/PaperItem';
import { Grid } from '@suid/material';
import Section from '../components/Section';
import { setPage } from '../signals/signals';
import { clientStore } from '../stores/LocalClientStore';
import { GetCallConnectionsResponse } from '../utils/MessageProtocol';
import { IceConnectionsGraph } from '../components/Charts/IceConnectionsGraph';

// import { setTestState } from '../signals/signals';
// import Button from '../components/Button';

// const TestResults = lazy(() => import('../components/TestResults'));

const Main: Component = () => {
	// eslint-disable-next-line no-unused-vars
	const [ error, setError ] = createSignal<string | undefined>();
	const [ timer, setTimer ] = createSignal<ReturnType<typeof setInterval> | undefined>();
	const [ connections, setConnections ] = createSignal<GetCallConnectionsResponse | undefined>();

	onMount(() => {
		setTimer(setInterval(async () => {
			// console.log(await clientStore.call?.getHamokState());

			if (!clientStore.call) return;
			const response = await clientStore.call.getCallConnections();
			if (response.connections.length < 1) return;
			if (connections()?.connections.length === response.connections.length) return;
			// console.warn('connections', response);
			setConnections(response);

		}, 1000));
		
	});

	onCleanup(() => {
		clearInterval(timer());
	});
	
	return (
		<Grid container spacing={2}>
			<Show when={error()}>
				<Grid item xs={12}>
					<ErrorPaperItem>{error()}</ErrorPaperItem>
				</Grid>
			</Show>
			<Grid item xs={12}>
				<Section title="WebRTC Observer">
					<p class='text-left text-base font-sans text-gray-600 antialiased text-justify'>
                        This demo website showcases samples for WebRTC observability. 
                        Deploying and monitoring WebRTC providing service should be as straightforward as: 
                        (1) deploying a web service to Kubernetes and 
                        (2) collecting metrics from a backend service. We built this website to 
                        demonstrate how to deploy a WebRTC service on Kubernetes using STUNner and how to monitor calls with ObserveRTC.
					</p>
				</Section>
				<Section title="STUNner" subsection={true}>
					<Show when={connections()} keyed>{(connections) => {
						return (
							<IceConnectionsGraph connections={connections.connections} />
						);
					}}
					</Show>
					<p class='text-left text-base font-sans text-gray-600 antialiased text-justify'>
                        STUNner is an open-source project designed to facilitate the deployment of WebRTC services within Kubernetes environments. It acts as a media gateway that provides standards-compliant STUN/TURN functionalities to ingest real-time media into a Kubernetes cluster, enabling a seamless integration of WebRTC services into the cloud-native ecosystem.
					</p>
					<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('ice-connection-page')}>
                        See ICE connection
					</a>
					<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('stunner')}>
                        Learn more about STUNner
					</a>
				</Section>

				<Section title="ClientMonitor" subsection={true}>
					<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('client-monitor-properties')}>
                        See ClientMonitor Properties
					</a>
					{/* <a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('main')}>
                        Detect Issues
					</a>
					<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('main')}>
                        Send Samples
					</a> */}
				</Section>

				{/* <Section title="Observer" subsection={true}>
					<p class='text-left text-base font-sans text-gray-600 antialiased text-justify'>
                        Short Intro about Observer
					</p>
					<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('main')}>
                        Monitor Calls
					</a>
					<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('main')}>
                        Show Turn Statistics
					</a>
				</Section> */}


				<Section title="About" subsection={false}>
					<p class='text-left text-base font-sans text-gray-600 antialiased text-justify'>
                        Powered by ObserveRTC and L7mp
					</p>
				</Section>
			</Grid>
		</Grid>
	);
};

export default Main;
