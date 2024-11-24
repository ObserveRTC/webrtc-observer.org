import { createSignal, type Component, Show } from 'solid-js';
import { Grid } from '@suid/material';
import Section from '../components/Section';
import { setPage } from '../signals/signals';
import { clientStore } from '../stores/LocalClientStore';

// import { setTestState } from '../signals/signals';
// import Button from '../components/Button';

// const TestResults = lazy(() => import('../components/TestResults'));

const StunnerPage: Component = () => {
	// eslint-disable-next-line no-unused-vars
	const [ error, setError ] = createSignal<string | undefined>();

	return (
		<Grid container spacing={2}>
			<Grid item xs={12}>
				<Section title="STUNner">
					<p class='text-left text-base font-sans text-gray-600 antialiased text-justify'>
						<a href="https://github.com/l7mp/stunner">STUNner</a> allows you to deploy any WebRTC service into Kubernetes, smoothly integrating it into the cloud-native ecosystem. STUNner exposes a standards-compliant STUN/TURN gateway for clients to access your virtualized WebRTC infrastructure running in Kubernetes, maintaining full browser compatibility and requiring minimal or no modification to your existing WebRTC codebase. STUNner supports the Kubernetes Gateway API so you can configure it in the familiar YAML-engineering style via Kubernetes manifests.
					</p>

					<p class='text-left text-base font-sans text-gray-600 antialiased text-justify'>
				STUNner exposes various statistics in an external time-series database like Prometheus. This way, one can observe the state of the STUNner media gateway instances, such as CPU or memory use or the amount of data received and sent in quasi-real-time. Below, we present a Grafana dashboard showing some of the key STUNner performance metrics.
					</p>


					<Show when={clientStore.call} fallback={(
						<b>Please join a call to see the STUNner metric dashboard.</b>
					)}>
						<iframe src="https://www.webrtc-observer.org/g/public-dashboards/c3f4bd864c094ad49396aab48a9aea09?from=now-5m&to=now&timezone=browser&theme=light" title="STUNner Metrics" height="480" />
					</Show>
				</Section>

				<Section>
					<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('main')}>Back</a>
				</Section>

			</Grid>
		</Grid>
	);
};

export default StunnerPage;
