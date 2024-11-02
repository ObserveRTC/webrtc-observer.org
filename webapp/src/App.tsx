import { Switch, type Component, Match, Show } from 'solid-js';
import { page } from './signals/signals';
import Join from './views/Join';
import { Transition } from 'solid-transition-group';
import ObserverView from './views/OngoingCalls';
import { Grid } from '@suid/material';
import VideoCall from './views/VideoCall';
import Main from './views/Main';
import { clientStore } from './stores/LocalClientStore';
import ClientMonitorProperties from './views/ClientMonitorProperties';
import SimpleCountdown from './components/Countdown/SimpleCountdown';
import Box from './components/Box';


const App: Component = () => {
	return (
		<Grid container spacing={2}>
			<Grid item xs={2} />
			<Grid item xs={7}>
				<Transition name='fade' mode='outin'>
					<Switch>
						<Match when={page() === 'main'}><Main/></Match>
						<Match when={page() === 'lobby'}><Join/></Match>
						<Match when={page() === 'client-monitor-properties'}><ClientMonitorProperties /></Match>
						<Match when={page() === 'videoCall'}><VideoCall /></Match>
						<Match when={page() === 'observer'}><ObserverView /></Match>
					</Switch>
				</Transition>
			</Grid>
			<Grid item xs={3}>
				<Show when={clientStore.call} fallback={<Join />}>
					<VideoCall />
				</Show>
				<Show when={clientStore.clientMaxLifetimeInMs}>
					<Box title={'Client Lifetime'} full={true}>
						<SimpleCountdown millis={(clientStore.clientMaxLifetimeInMs ?? 0) - (Date.now() - (clientStore.clientCreatedServerTimestamp ?? 0))} onZero={() => clientStore.call?.close()}/>
					</Box>
				</Show>
			</Grid>
			{/* <Grid item xs={12}>
				<PoweredByCmp />
			</Grid> */}
		</Grid>
	
		
	);
};

export default App;
