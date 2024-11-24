import { createSignal, Show, type Component, For, onMount, onCleanup } from 'solid-js';
import { Grid } from '@suid/material';
import Section from '../components/Section';
import { setPage } from '../signals/signals';
import { clientStore } from '../stores/LocalClientStore';
import GenericTable from '../components/GeneralTable';
import { ClientMonitor, LocalCandidateEntry, PeerConnectionEntry, RemoteCandidateEntry } from '@observertc/client-monitor-js';
import JSONFormatter from 'json-formatter-js';

// import { setTestState } from '../signals/signals';
// import Button from '../components/Button';

// const TestResults = lazy(() => import('../components/TestResults'));

type IceConnectionPageProps = {
	monitor: ClientMonitor;
};

const IceConnectionPage: Component<IceConnectionPageProps> = (props: IceConnectionPageProps) => {
	// eslint-disable-next-line no-unused-vars
	const [ peerConnections, setPeerConnections ] = createSignal<{ pc: PeerConnectionEntry, stats: Record<string, unknown>}[] | undefined>();
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
			const pcs: { pc: PeerConnectionEntry, stats: Record<string, unknown>}[] = [];
			
			for (const pc of props.monitor.peerConnections) {
				const oStats = pc.getSelectedIceCandidatePair()?.stats;

				if (!oStats) continue;

				const stats: Record<string, unknown> = {
					availableIncomingBitrate: oStats.availableIncomingBitrate,
					availableOutgoingBitrate: oStats.availableOutgoingBitrate,
					bytesReceived: oStats.bytesReceived,
					bytesSent: oStats.bytesSent,
					packetsReceived: oStats.packetsReceived,
					packetsSent: oStats.packetsSent
				};
				pcs.push({
					pc,
					stats
				});
			}

			0 < pcs.length && setPeerConnections(pcs);
		};
		setListener({ func });
		props.monitor?.on('stats-collected', func);
	});

	onCleanup(() => {
		clientStore.call?.monitor?.off('stats-collected', listener().func);
	});

	return (
		<Grid container spacing={2}>
			<Grid item xs={12}>
				<For each={peerConnections()}>{({ pc, stats }) => {
								
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
										]} />{new JSONFormatter(stats).render()}
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
