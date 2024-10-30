import { Switch, type Component, Match, Show } from 'solid-js';
import { page } from './signals/signals';
import Join from './views/Join';
import { Transition } from 'solid-transition-group';
import ObserverView from './views/OngoingCalls';
import { Grid } from '@suid/material';
import ClientMonitor from './components/ClientMonitor/ClientMonitor';
import VideoCall from './views/VideoCall';
import Main from './views/Main';
import { clientStore } from './stores/LocalClientStore';


const App: Component = () => {
	return (
		<Grid container spacing={2}>
			<Grid item xs={9}>
				<Transition name='fade' mode='outin'>
					<Switch>
						<Match when={page() === 'main'}><Main/></Match>
						<Match when={page() === 'lobby'}><Join/></Match>
						<Match when={page() === 'clientMonitor'}><ClientMonitor /></Match>
						<Match when={page() === 'videoCall'}><VideoCall /></Match>
						<Match when={page() === 'observer'}><ObserverView /></Match>
					</Switch>
				</Transition>
			</Grid>
			<Grid item xs={3}>
				<Show when={clientStore.call} fallback={<Join />}>
					<VideoCall />
				</Show>
			</Grid>
			{/* <Grid item xs={12}>
				<PoweredByCmp />
			</Grid> */}
		</Grid>
	
		
	);
};

export default App;
