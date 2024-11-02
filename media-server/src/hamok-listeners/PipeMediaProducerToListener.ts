import { createLogger } from "../common/logger";
import { HamokService, HamokServiceEventMap } from "../services/HamokService";
import { MediasoupService } from "../services/MediasoupService";

const logger = createLogger('PipeMediaProducerToRemoteRouterListener');

export type PipeMediaProducerToListenerContext = {
	mediasoupService: MediasoupService,
	hamokService: HamokService
}

export function createPipeMediaProducerToListener(listenerContext: PipeMediaProducerToListenerContext) {
	const { 
		mediasoupService,
		hamokService,
	} = listenerContext;

	const result = async (...options: HamokServiceEventMap['pipe-media-producer-to']) => {
		const [{ 
			dstRouterId,
			srcRouterId,
			mediaProducerId,
		}, respond] = options;

		if (!mediasoupService.routers.has(srcRouterId)) return;

		logger.debug(`Requested to pipe media producer ${mediaProducerId} from router ${srcRouterId} to router ${dstRouterId}`);

		try {
			logger.debug(`Consuming media producer ${mediaProducerId} from router ${srcRouterId} to forward traffic to router ${dstRouterId}`);

			const consumer = await mediasoupService.getOrCreatePipedMediaConsumer({
				srcRouterId,
				dstRouterId,
				mediaProducerId,
			});

			consumer.observer.once('close', () => {

				// notify the other peers about the close
				hamokService.publishPipeMediaConsumerClosed({
					mediaProducerId: consumer.producerId,
				})
			});

			respond({
				kind: consumer.kind,
				rtpParameters: consumer.rtpParameters,
				id: consumer.producerId,
			})

		} catch (err) {
			respond(undefined, `${err}`)
		}
		
		
	};

	return result;
}