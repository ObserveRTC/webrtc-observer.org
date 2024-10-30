import { Show, createSignal, type Component } from 'solid-js';
import { ErrorPaperItem } from '../components/PaperItem';
import { Grid } from '@suid/material';
import Section from '../components/Section';
import { setPage } from '../signals/signals';

// import { setTestState } from '../signals/signals';
// import Button from '../components/Button';

// const TestResults = lazy(() => import('../components/TestResults'));

const Main: Component = () => {
	// eslint-disable-next-line no-unused-vars
	const [ error, setError ] = createSignal<string | undefined>();

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
					<p class='text-left text-base font-sans text-gray-600 antialiased text-justify'>
                        Short intro about STUNner
					</p>
					<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('main')}>
                        Monitor STUNner
					</a>
					<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('main')}>
                        Check Deployment scripts
					</a>
					<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('main')}>
                        Learn more about STUNner
					</a>
				</Section>

				<Section title="ClientMonitor" subsection={true}>
					<p class='text-left text-base font-sans text-gray-600 antialiased text-justify'>
                        Short Intro about ClientMonitor
					</p>
					<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('client-monitor-properties')}>
                        See ClientMonitor Properties
					</a>
					<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('main')}>
                        Detect Issues
					</a>
					<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('main')}>
                        Send Samples
					</a>
				</Section>

				<Section title="Observer" subsection={true}>
					<p class='text-left text-base font-sans text-gray-600 antialiased text-justify'>
                        Short Intro about Observer
					</p>
					<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('main')}>
                        Monitor Calls
					</a>
					<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('main')}>
                        Show Turn Statistics
					</a>
				</Section>


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
