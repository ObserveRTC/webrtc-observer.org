import { createSignal, type Component } from 'solid-js';
import { Grid } from '@suid/material';
import Section from '../components/Section';
import { setPage } from '../signals/signals';

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

				More about STUNner...

				STUNner metrics
				<iframe src="https://www.webrtc-observer.org/g/public-dashboards/c3f4bd864c094ad49396aab48a9aea09?from=now-5m&to=now&timezone=browser" title="STUNner Metrics"></iframe>

				</Section>

				<Section>
					<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('main')}>Back</a>
				</Section>

			</Grid>
		</Grid>
	);
};

export default StunnerPage;
