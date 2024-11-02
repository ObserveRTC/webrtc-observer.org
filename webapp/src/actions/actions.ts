import { createEffect } from 'solid-js';
import { Connection, ConnectionConfig } from '../utils/Connection';
import { clientStore } from '../stores/LocalClientStore';
import { addAudioConsumerId, addVideoConsumerId, removeAudioConsumerId, removeVideoConsumerId } from '../stores/RemoteClientsStore';
import { JoinCallResponsePayload } from '../utils/MessageProtocol';

// const logger = console;

const MAX_BITRATE = 2000000;

let call: Connection | undefined;

declare global {
	// eslint-disable-next-line no-unused-vars
	interface Window {
		call?: Connection;
	}
}

createEffect(() => {
	// if (testState() === 'completed') {
	// 	call?.close();
	
	// 	webcamTrack()?.stop();
	// 	setWebcamTrack();
	// 	micTrack()?.stop();
	// 	setMicTrack();
	// }
});

export const joinToCall = async (config: ConnectionConfig): Promise<Pick<JoinCallResponsePayload, 'clientCreatedServerTimestamp' | 'clientMaxLifetimeInMs' | 'innerServerIp'>> => {

	try {
		if (!call) {
			call = new Connection(config);
			window.call = call;
			call.once('close', () => {
				call = undefined;
				window.call = undefined;
			});
			handleCall(call);
		}

		return call.join();
	} catch (error) {
		console.error('joinToCall error', error);
		call?.close();
		throw error;
		// batch(() => {
		// 	setTestResults({ mediaConnection: '
		// 	setTestState('completed');
		// });
	}
};

export const handleCall = (call: Connection): void => {
	call.on('newconsumer', (consumer) => {
		consumer.resume();

		if (consumer.kind === 'video') {
			addVideoConsumerId(consumer.id);
		} else {
			addAudioConsumerId(consumer.id);
		}

		consumer.observer.on('close', () => {	
			if (consumer.kind === 'video') {
				removeVideoConsumerId(consumer.id);
			} else if (consumer.kind === 'audio') {
				removeAudioConsumerId(consumer.id);
			}
		});
	});
};

export const produceMedia = async (): Promise<void> => {
	if (!call) throw new Error('produceMedia() call not initialized');

	let callError: string | undefined;
	const onError = (err: any) => (callError = `${err}`);

	call.on('error', onError);
	try {
		if (!clientStore.mediaStream) throw new Error('produceMedia() missing webcam or mic track');

		const [ webcamTrack ] = clientStore.mediaStream.getVideoTracks();
		const [ micTrack ] = clientStore.mediaStream.getAudioTracks();

		await Promise.all([
			call.sndTransport?.produce({ 
				track: webcamTrack, 
				encodings: [ 
					{ maxBitrate: 200000, scaleResolutionDownBy: 4 }, 
					{ maxBitrate: 500000, scaleResolutionDownBy: 2 }, 
					{ maxBitrate: MAX_BITRATE, scaleResolutionDownBy: 1 } 
				]
			}),
			
			call.sndTransport?.produce({ track: micTrack }),
		]);

		if (callError) throw new Error(callError);
	} finally {
		call.off('error', onError);
	}
};
