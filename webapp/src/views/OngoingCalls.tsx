import { Component, createSignal, For } from 'solid-js';
import { ObservedGetOngoingCallResponse } from '../utils/MessageProtocol';
import Box from '../components/Box';
import { Accordion } from '../components/Accordion/Accordion';
import OngoingCall from '../components/OngoingCall';
import { clientStore } from '../stores/LocalClientStore';
import { AutoRefreshBar } from '../AutoRefreshBar';

// const TestResults = lazy(() => import('../components/TestResults'));

const ObserverView: Component = () => {
	const [ ongoingCalls, setOngoingCalls ] = createSignal<ObservedGetOngoingCallResponse['calls']>([]);
	const [ selectedCall, setSelectedCall ] = createSignal<ObservedGetOngoingCallResponse['calls'][number] | null>(null);

	return (
		<Box title="Ongoing Calls" full={true}>
			<AutoRefreshBar durationInS={10} onComplete={() => {
				clientStore.call?.getOngoingCalls().then(payload => setOngoingCalls(payload.calls)).catch(console.error);
			}} 
			paused={() => selectedCall() !== null}
			/>
			<For each={ ongoingCalls() }>{call => (
				<Accordion title={call.callId.slice(0, -8) + '********'} open={selectedCall()?.callId === call.callId} onOpen={() => setSelectedCall(call)} onClose={() => setSelectedCall(null)}>
					<OngoingCall {...call} />
				</Accordion>
			)}
			</For>
		</Box>
			
	);
};

export default ObserverView;
