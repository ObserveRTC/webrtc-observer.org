import { createLogger } from "../common/logger";
import { Server } from "../Server";
import { HamokServiceEventMap } from "../services/HamokService";
import { MediasoupService } from "../services/MediasoupService";

const logger = createLogger('GetClientProducers');

export type PipedMediaConsumerClosedListenerContext = {
	mediasoupService: MediasoupService,
}

export function createPipedMediaConsumerClosedListener(listenerContext: PipedMediaConsumerClosedListenerContext) {
	const { 
		mediasoupService,
	} = listenerContext;

	const result = async (...options: HamokServiceEventMap['piped-media-consumer-closed']) => {
		const [{ 
			mediaProducerId,
		}] = options;

		mediasoupService.closePipedMediaProducer(mediaProducerId)
	};

	return result;
}