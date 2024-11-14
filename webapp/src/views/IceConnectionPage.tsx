import { createSignal, Show, type Component, For, onMount, onCleanup } from 'solid-js';
import { Grid } from '@suid/material';
import Section from '../components/Section';
import { setPage } from '../signals/signals';
import { clientStore } from '../stores/LocalClientStore';
import GenericTable from '../components/GeneralTable';
import { ClientMonitor, LocalCandidateEntry, PeerConnectionEntry, RemoteCandidateEntry } from '@observertc/client-monitor-js';
import { GetCallConnectionsResponse } from '../utils/MessageProtocol';
import { IceConnectionsGraph } from '../components/Charts/IceConnectionsGraph';

// import { setTestState } from '../signals/signals';
// import Button from '../components/Button';

// const TestResults = lazy(() => import('../components/TestResults'));

type IceConnectionPageProps = {
	monitor: ClientMonitor;
};

const IceConnectionPage: Component<IceConnectionPageProps> = (props: IceConnectionPageProps) => {
	// eslint-disable-next-line no-unused-vars
	const [ peerConnections, setPeerConnections ] = createSignal<PeerConnectionEntry[] | undefined>();
	const [ listener, setListener ] = createSignal<{ func: () => void }>({ func: () => {} });
	// clientStore.call?.monitor.
	const getCandidateTypeString = (candidateType?: LocalCandidateEntry | RemoteCandidateEntry) => {
		if (!candidateType) return '';
		if (candidateType.stats.candidateType === 'relay') {
			return `relay (${candidateType.stats.protocol}) ${candidateType.stats.url}`;
		}
	};
	const [ timer, setTimer ] = createSignal<ReturnType<typeof setInterval> | undefined>();
	const [ connections, setConnections ] = createSignal<GetCallConnectionsResponse | undefined>();

	onMount(() => {
		const func = () => {
			const peerConnections = props.monitor?.peerConnections;
			peerConnections && setPeerConnections([...peerConnections]);
		};
		setListener({ func });
		props.monitor?.on('stats-collected', func);

		setTimer(setInterval(async () => {
			if (!clientStore.call) return;
			const response = await clientStore.call.getCallConnections();
			if (response.connections.length < 1) return;
			if (connections()?.connections.length === response.connections.length) return;
			// console.warn('connections', response);
			setConnections(response);
		}, 1000));
		
	});

	onCleanup(() => {
		clientStore.call?.monitor?.off('stats-collected', listener().func);
		clearInterval(timer());
	});

	return (
		<Grid container spacing={2}>
			<Grid item xs={12}>
				<Section title="ICE Connection">
					<Show when={connections()} keyed>{(connections) => {
						return (
							<IceConnectionsGraph connections={connections.connections}  />
						);
					}}
					</Show>
				</Section>
				
				<For each={peerConnections()}>{pc => {
								
					return (
						<Section title={`PeerConnection (${pc.label})`}>
							<Show when={pc.getSelectedIceCandidatePair()} keyed>{(selectedPair) => {
								return (
									<>
										<p>
											<b>Selected ICE Candidate Pair</b>: {selectedPair.stats.id}
										</p>
										<p>
											<b>State</b>: {selectedPair.stats.state}
										</p>
										<p>
											<b>Network type / address</b>: {selectedPair.getLocalCandidate()?.stats.networkType}
										</p>
										<GenericTable data={[
											{
												'': 'local',
												'candidateId': selectedPair.getLocalCandidate()?.stats.id,
												'Candidate type': getCandidateTypeString(selectedPair.getLocalCandidate()),
												'address': `${selectedPair.getLocalCandidate()?.stats.address}`,
												'port': selectedPair.getLocalCandidate()?.stats.port,
												// networkType: selectedPair.getLocalCandidate()?.stats.,
												// address: `${selectedPair.getLocalCandidate()?.stats.address}:${selectedPair.getLocalCandidate()?.stats.port}`,
												// protocol: selectedPair.getLocalCandidate()?.stats.port,
												// priority: selectedPair.getLocalCandidate()?.stats.priority,
												// rtt: selectedPair.stats.currentRoundTripTime,
											},
											{
												'': 'remote',
												'candidateId': selectedPair.getRemoteCandidate()?.stats.id,
												'Candidate type': getCandidateTypeString(selectedPair.getRemoteCandidate()),
												'address': `${selectedPair.getRemoteCandidate()?.stats.address}`,
												'port': selectedPair.getRemoteCandidate()?.stats.port,
											}
										]} />
										{/* <div class='flex flex-col bg-white p-4 gap-2'>
														<p>
															<b>State</b>: {selectedPair.stats.state}
														</p>
														<p>
															<b>Local Address: </b>{selectedPair.getLocalCandidate()?.stats.address}:{selectedPair.getLocalCandidate()?.stats.port}
														</p>
														<p>
															<b>Local Candidate Type: </b>{selectedPair.getLocalCandidate()?.stats.candidateType}
														</p>
														<p>
															<b>Remote Address: </b>{selectedPair.getRemoteCandidate()?.stats.address}:{selectedPair.getRemoteCandidate()?.stats.port}
														</p>

													
														<b>Local Candidate:</b> 
														{new JSONFormatter(selectedPair.getLocalCandidate()?.stats).render()}
														<hr />
														<b>Remote Candidate:</b>
														{new JSONFormatter(selectedPair.getRemoteCandidate()?.stats).render()}
													</div> */}
									</>
								);}}
							</Show>
						</Section>
					);}}
								

				</For>
					
				<Section>
					<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('main')}>Back</a>
				</Section>
				
			</Grid>
		</Grid>
	);
};

export default IceConnectionPage;
