import { createStore } from 'solid-js/store';
import { ConnectionConfig } from '../utils/Connection';
import { v4 as uuid } from 'uuid';

const DEFAULT_PORT = (new URL(window.location.href)).searchParams.get('port') ?? '9080';
// const SERVER = undefined;
const SERVER = 'wss://media.webrtc-observer.org:443';

const forceRelay = window.location.search.includes('forceRelay') ? true : undefined;
const callId = (new URL(window.location.href)).searchParams.get('callId') ?? undefined;
// const forcedRelay = false;

export const [ callConfig, setCallConfig ] = createStore<ConnectionConfig>({
	monitor: {
		collectingPeriodInMs: 1000,
	},
	requestTimeoutInMs: 10000,
	serverUri: import.meta.env.VITE_MEDIA_SERVER_HOST ?? SERVER ?? `ws://localhost:${DEFAULT_PORT}`,
	clientId: uuid(),
	callId,
	forceRelay: forceRelay ?? import.meta.env.VITE_FORCE_RELAY === 'true',
});