import { Show, createSignal, onMount, type Component } from 'solid-js';
import { clientStore } from '../../stores/LocalClientStore';
import ShowObject from './ShowObject';
import { createClientMonitorProps } from '../../actions/client-monitor-props';


const ClientMonitor: Component = () => {
	const [ monitor, setClientMonitor ] = createSignal(clientStore.call?.monitor);

	onMount(() => {
		const clientMonitor = clientStore.call?.monitor;
		if (!clientMonitor) return;
		setClientMonitor(clientMonitor);
	});
	return (
		<>
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
