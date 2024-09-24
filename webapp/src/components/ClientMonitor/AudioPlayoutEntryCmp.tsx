import { Component, Setter, createSignal, onCleanup, onMount } from 'solid-js';
import { clientStore } from '../../stores/LocalClientStore';
import { ClientMonitorEntryRender } from './ClientMonitorShowEntry';
import EntryBaseCmp, { IterableNavigationItem, NavigationItem } from './EntryBaseCmp';
import PeerConnectionEntryCmp from './PeerConnectionEntryCmp';
import { AudioPlayoutEntry } from '@observertc/client-monitor-js/lib/entries/StatsEntryInterfaces';

export type AudioPlayoutEntryProps = {
	entry: AudioPlayoutEntry;
	next: Setter<ClientMonitorEntryRender>;
}

const AudioPlayoutEntryCmp: Component<AudioPlayoutEntryProps> = (props: AudioPlayoutEntryProps) => {
	const [ properties, setProperties ] = createSignal<Record<string, unknown>>({});
	const [ navigations, setNavigations ] = createSignal<NavigationItem[]>([]);
	const [ iterableNavigations, setIterableNavigations ] = createSignal<IterableNavigationItem[]>([]);
	const onChange = () => {
		setNavigations([
			{
				name: 'getPeerConnection',
				buttonName: 'Peer Connection',
				action: () => PeerConnectionEntryCmp({ entry: props.entry.getPeerConnection()!, next: props.next })
			}
		]);
		setIterableNavigations([
		]);
		setProperties({
			
			// last property
			stats: props.entry.stats
		});
	};
	onMount(() => {
		clientStore.call?.monitor?.on('stats-collected', onChange);
	});
	onCleanup(() => {
		clientStore.call?.monitor?.off('stats-collected', onChange);
	});
	return (
		<EntryBaseCmp properties={properties()} navigations={navigations()} iterableNavigations={iterableNavigations()} next={props.next} />
	);
};

export default AudioPlayoutEntryCmp;