import { createSignal, Show, type Component, For, onMount, onCleanup } from 'solid-js';
import { Grid } from '@suid/material';
import Section from '../components/Section';
import { setPage } from '../signals/signals';
import { clientStore } from '../stores/LocalClientStore';
import GenericTable from '../components/GeneralTable';
import { LocalCandidateEntry, PeerConnectionEntry, RemoteCandidateEntry } from '@observertc/client-monitor-js';

// import { setTestState } from '../signals/signals';
// import Button from '../components/Button';

// const TestResults = lazy(() => import('../components/TestResults'));

const IceConnectionPage: Component = () => {
	// eslint-disable-next-line no-unused-vars
	const [ error, setError ] = createSignal<string | undefined>();
	const [ peerConnections, setPeerConnections ] = createSignal<PeerConnectionEntry[] | undefined>();
	const [ listener, setListener ] = createSignal<{ func: () => void }>({ func: () => {} });
	// clientStore.call?.monitor.
	const getCandidateTypeString = (candidateType?: LocalCandidateEntry | RemoteCandidateEntry) => {
		if (!candidateType) return '';
		if (candidateType.stats.candidateType === 'relay') {
			return `relay (${candidateType.stats.protocol}) ${candidateType.stats.url}`;
		}
	};

	onMount(() => {
		const func = () => {
			const peerConnections = clientStore.call?.monitor?.peerConnections;
			peerConnections && setPeerConnections([...peerConnections]);
		};
		setListener({ func });

		clientStore.call?.monitor?.on('stats-collected', func);
	});

	onCleanup(() => {
		clientStore.call?.monitor?.off('stats-collected', listener().func);
	});

	return (
		<Grid container spacing={2}>
			<Grid item xs={12}>
				<Section title="ICE Connection">
                    ICE connection details
					
				</Section>

				<For each={peerConnections()}>{pc => {
					console.warn('monitor', pc.iceCandidatePairs());
								
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
