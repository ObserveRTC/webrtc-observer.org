import { Show, createSignal, onMount, type Component, For } from 'solid-js';
import Box from '../components/Box';
import LocalClientVideo from '../components/LocalClientVideo';
import { produceMedia } from '../actions/actions';
import { ErrorPaperItem } from '../components/PaperItem';
import { Grid, IconButton } from '@suid/material';
import { remoteClientStore } from '../stores/RemoteClientsStore';
import RemoteClientVideo from '../components/RemoteClientVideo';
import RemoteClientAudio from '../components/RemoteClientAudio';
import { clientStore } from '../stores/LocalClientStore';
import { writeClipboard } from '@solid-primitives/clipboard';
// import { setTestState } from '../signals/signals';
// import Button from '../components/Button';

// const TestResults = lazy(() => import('../components/TestResults'));

const VideoCall: Component = () => {
	const [ error, setError ] = createSignal<string | undefined>();
	const [ copyBtnText, setCopyBtnText ] = createSignal<string | undefined>();

	onMount(() => {
		produceMedia().catch((e) => setError(`${e}`));
	});

	return (
		<Grid container spacing={2}>
			<Show when={error()}>
				<Grid item xs={12}>
					<ErrorPaperItem>{error()}</ErrorPaperItem>
				</Grid>
			</Show>
			{/* <Grid item xs={8}>
				<Box full={true}>
					<ClientMonitorBaseCharts />
				</Box>
				
			</Grid> */}
			{/* <Grid item xs={4}> */}
			<Box title={'Call'} full={true}>
				<div><b>CallId</b>: {clientStore.call?.callId} 
					<IconButton 
						disabled={Boolean(clientStore.call) === false}
						onClick={() => {
							writeClipboard(clientStore.call?.callId ?? '');
							setCopyBtnText('Copied');
							setTimeout(() => {
								setCopyBtnText();
							}, 2000);
						}}> 
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#434343"><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"/></svg>
					</IconButton>
					{copyBtnText()}
				</div>
			</Box>
			

			<Box title={'Local Client'} full={true}>
				<div><b>ClientId</b>: {clientStore.call?.config.clientId}</div>
				<div><b>UserId</b>: {clientStore.userId}</div>
				<LocalClientVideo showControls={true} />
				{/* <ClientMonitorStateProperties /> */}
			</Box>
			<For each={remoteClientStore.videoConsumerIds}>{(consumerId) => (
				<Box title={`Remote Client (${consumerId})`} full={true}>
					<RemoteClientVideo consumerId={consumerId} />
				</Box>
			)}
			</For>
			<For each={remoteClientStore.audioConsumerIds}>{(consumerId) => (
				<>
					<RemoteClientAudio consumerId={consumerId} />
				</>
			)}
			</For>
		</Grid>
		// </Grid>
	);
};

export default VideoCall;
