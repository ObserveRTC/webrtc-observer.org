import { createStore } from 'solid-js/store';
import { ConnectionConfig } from '../utils/Connection';
import { v4 as uuid } from 'uuid';



export const [ callConfig, setCallConfig ] = createStore<ConnectionConfig>({
	monitor: {
		collectingPeriodInMs: 1000,
	},
	requestTimeoutInMs: 10000,
	serverUri: import.meta.env.VITE_MEDIA_SERVER_HOST ?? 'ws://localhost:9080',
	clientId: uuid(),
	callId: undefined,
});