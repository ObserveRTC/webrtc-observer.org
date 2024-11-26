import { Show, createSignal, onCleanup, onMount, type Component, For } from 'solid-js';
import { ErrorPaperItem } from '../components/PaperItem';
import { Grid } from '@suid/material';
import Section from '../components/Section';
import { clientStore } from '../stores/LocalClientStore';
import { ObserverGetCallStatsResponse } from '../utils/MessageProtocol';
import { setPage } from '../signals/signals';
import { Accordion } from '../components/Accordion/Accordion';
import { CalculatedScoresChart } from '../components/Charts/CalculatedScoresChart';

// import { setTestState } from '../signals/signals';
// import Button from '../components/Button';

// const TestResults = lazy(() => import('../components/TestResults'));

const CallScoresPage: Component = () => {
	// eslint-disable-next-line no-unused-vars
	const [ error, setError ] = createSignal<string | undefined>();
	const [ timer, setTimer ] = createSignal<ReturnType<typeof setInterval> | undefined>();
	const [ response, setResponse ] = createSignal<ObserverGetCallStatsResponse | undefined>();
	const [ openedIds, setOpenedIds ] = createSignal<string[]>([]);

	onMount(() => {
		setTimer(setInterval(async () => {
			// console.log(await clientStore.call?.getHamokState());

			if (!clientStore.call) return setResponse(undefined);
			const resp = await clientStore.call.getCallStats();
			
			console.log('resp', resp);

			setResponse(resp);

		}, 10000));
		
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
				<Section title="Observer Calculated Call Scores">
					<p class='text-left text-base font-sans text-gray-600 antialiased text-justify'>
                        This page shows the calculated call scores for rooms.
					</p>
					<Show when={response()} fallback={(
						<Show when={clientStore.call} fallback={(<b>Please join to a call</b>)}>
							<b>Score data is refreshed in every 10s...</b>
						</Show>
					)} keyed>{resp => (
							<For each={resp.rooms} fallback={<b>No scores available.</b>}>{(room) => (
								<div>
									<Accordion 
										title={`Room ${room.roomId}`} 
										onOpen={() => setOpenedIds([...openedIds(), room.roomId])}
										onClose={() => setOpenedIds(openedIds().filter(r => r !== room.roomId))}
										open={openedIds().includes(room.roomId)}
									>
										<CalculatedScoresChart scores={room.callScores} title={`Call Scores (room: ${room.roomId})`}/>
										<For each={room.clients} fallback={<b>No clients in room.</b>}>{(client) => (
											<>
												<b>Clients:</b><br />
												<a href="#" onClick={() => openedIds().includes(client.clientId)
													? setOpenedIds(openedIds().filter(r => r !== client.clientId))
													: setOpenedIds([...openedIds(), client.clientId])} class="text-blue-600 dark:text-blue-500 hover:underline"
												>{client.userId ?? 'Client'} ({client.clientId})</a>
												<br />
												<Show when={openedIds().includes(client.clientId)}>
													<For each={client.peerConnections} fallback={<b style={{ 'padding-left': '1em'}}>No PeerConnection assigned to the client.</b>}>{(peerConnection) => (
														<>
															<a style={{ 'padding-left': '1em'}}
																href="#" onClick={() => openedIds().includes(peerConnection.peerConnectionId)
																	? setOpenedIds(openedIds().filter(r => r !== peerConnection.peerConnectionId))
																	: setOpenedIds([...openedIds(), peerConnection.peerConnectionId])} class="text-blue-600 dark:text-blue-500 hover:underline"
															>PeerConnection {peerConnection.peerConnectionId}</a>
															<br />
															<Show when={openedIds().includes(peerConnection.peerConnectionId)}>
																<For each={peerConnection.inboundAudioTracks} fallback={<><b style={{ 'padding-left': '2em'}}>No Inbound Audio Track found.</b><br /></>}>{(track) => (
																	<>
																		<a style={{ 'padding-left': '2em'}}
																			href="#" onClick={() => openedIds().includes(track.trackId)
																				? setOpenedIds(openedIds().filter(r => r !== track.trackId))
																				: setOpenedIds([...openedIds(), track.trackId])} class="text-blue-600 dark:text-blue-500 hover:underline"
																		>Inbound Audio Track {track.trackId}</a>
																		<br />
																	</>
																)}
																</For>
																<For each={peerConnection.inboundVideoTracks} fallback={<><b style={{ 'padding-left': '2em'}}>No Inbound Video Track found.</b><br /></>}>{(track) => (
																	<>
																		<a style={{ 'padding-left': '2em'}}
																			href="#" onClick={() => openedIds().includes(track.trackId)
																				? setOpenedIds(openedIds().filter(r => r !== track.trackId))
																				: setOpenedIds([...openedIds(), track.trackId])} class="text-blue-600 dark:text-blue-500 hover:underline"
																		>Inbound Video Track {track.trackId}</a>
																		<br />
																	</>
																)}
																</For>
																<For each={peerConnection.outboundAudioTracks} fallback={<><b style={{ 'padding-left': '2em'}}>No Outbound Audio Track found.</b><br /></>}>{(track) => (
																	<>
																		<a style={{ 'padding-left': '2em'}}
																			href="#" onClick={() => openedIds().includes(track.trackId)
																				? setOpenedIds(openedIds().filter(r => r !== track.trackId))
																				: setOpenedIds([...openedIds(), track.trackId])} class="text-blue-600 dark:text-blue-500 hover:underline"
																		>Outbound Audio Track {track.trackId}</a>
																		<br />
																	</>
																)}
																</For>
																<For each={peerConnection.outboundVideoTracks} fallback={<><b style={{ 'padding-left': '2em'}}>No Outbound Video Track found.</b><br /></>}>{(track) => (
																	<>
																		<a style={{ 'padding-left': '2em'}}
																			href="#" onClick={() => openedIds().includes(track.trackId)
																				? setOpenedIds(openedIds().filter(r => r !== track.trackId))
																				: setOpenedIds([...openedIds(), track.trackId])} class="text-blue-600 dark:text-blue-500 hover:underline"
																		>Outbound Video Track {track.trackId}</a>
																		<br />
																	</>
																)}
																</For>
															</Show>
														</>
													)}
													</For>
												</Show>
											</>
											
										)}
										</For>
										<For each={room.clients}>{(client) => (
											<Show when={openedIds().includes(client.clientId)}>
												<CalculatedScoresChart scores={client.clientScores} title='Client Scores'/>
												<For each={client.peerConnections}>{(peerConnection) => (
													<Show when={openedIds().includes(peerConnection.peerConnectionId)}>
														<CalculatedScoresChart scores={peerConnection.peerConnectionScores} title={`PeerConnection Scores (${peerConnection.peerConnectionId})`} />
														<For each={peerConnection.inboundAudioTracks}>{(track) => (
															<Show when={openedIds().includes(track.trackId)}>
																<CalculatedScoresChart scores={track.trackScores} title={`Inbound Audio Track (${track.trackId})`} />
															</Show>
														)}
														</For>
														<For each={peerConnection.inboundVideoTracks}>{(track) => (
															<Show when={openedIds().includes(track.trackId)}>
																<CalculatedScoresChart scores={track.trackScores} title={`Inbound Video Track (${track.trackId})`} />
															</Show>
														)}
														</For>
														<For each={peerConnection.outboundAudioTracks}>{(track) => (
															<Show when={openedIds().includes(track.trackId)}>
																<CalculatedScoresChart scores={track.trackScores} title={`Outbound Audio Track (${track.trackId})`} />
															</Show>
														)}	
														</For>
														<For each={peerConnection.outboundVideoTracks}>{(track) => (
															<Show when={openedIds().includes(track.trackId)}>
																<CalculatedScoresChart scores={track.trackScores} title={`Outbound Video Track (${track.trackId})`} />
															</Show>
														)}
														</For>
													</Show>
												)}
												</For>
												{/* <For each={client.peerConnections} fallback={<b>No PeerConnection assigned to the client.</b>}>{(peerConnection) => (
													<CalculatedScoresChart scores={peerConnection.peerConnectionScores} xAxisName='PeerConnection Scores'/>
												)}
												</For> */}
											</Show>
											
										)}
										</For>
									
									</Accordion>
								</div>
							)}</For>
						)}
					</Show>
				</Section>
				<Section>
					<a href="#" class="text-sm text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setPage('main')}>Back</a>
				</Section>
			</Grid>
		</Grid>
	);
};

export default CallScoresPage;
