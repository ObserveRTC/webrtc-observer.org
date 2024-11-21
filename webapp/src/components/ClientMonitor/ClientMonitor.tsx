import { Show, createSignal, onMount, type Component } from 'solid-js';
import Box from '../Box';
import { ErrorPaperItem } from '../PaperItem';
import { clientStore } from '../../stores/LocalClientStore';
import ShowObject, { ShowObjectProperties } from './ShowObject';
import { createClientMonitorProps } from '../../actions/client-monitor-props';


const ClientMonitor: Component = () => {
	const [ error, setError ] = createSignal<string | undefined>();
	const [ monitor, setClientMonitor ] = createSignal(clientStore.call?.monitor);
	const [ monitorProps, setMonitorProps ] = createSignal<ShowObjectProperties>({
		
	});

	onMount(() => {
		const clientMonitor = clientStore.call?.monitor;
		if (!clientMonitor) return;
		clientMonitor.on('error', (e) => setError(`${e}`));
		setClientMonitor(clientMonitor);
	});
	return (
		<>
			<Show when={error()}>
				<Box full={true}>
					<ErrorPaperItem>{error()}</ErrorPaperItem>
				</Box>
			</Show>
			<Show when={(monitor())} keyed>{(m) => {
				return (
					<>
						<p class='text-left text-base font-sans text-gray-600 antialiased text-justify'>
							An instance of the ClientMonitor class has the following properties: 
						</p>
						<ShowObject 
							{...createClientMonitorProps(m)}
						/>
					</>
					
				);
			}}</Show>
			
		</>
		
	);
};

export default ClientMonitor;
