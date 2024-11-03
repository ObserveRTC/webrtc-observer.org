import { Server } from "../Server";
import { ClientContext } from "../common/ClientContext";
import { createLogger } from "../common/logger";
import { ConsumerCreatedNotification, CreateTransportResponsePayload, Response } from "../protocols/MessageProtocol";
import { MediasoupService } from "../services/MediasoupService";
import * as mediasoup from 'mediasoup';
import { ClientMessageContext } from "./ClientMessageListener";
import { HamokService } from "../services/HamokService";

const logger = createLogger('CreateTransportRequestListener');

export type CreateTransportRequestListenerContext = {
		server: Server,
		mediasoupService: MediasoupService;
		hamokService: HamokService,
};

export function createCreateTransportRequestListener(listenerContext: CreateTransportRequestListenerContext) {
		const { 
			server,
			mediasoupService,
			hamokService,
		} = listenerContext;
		
		const result = async (messageContext: ClientMessageContext) => {
				const { 
					client,
					message: request,
					send,
				} = messageContext;

				if (request.type !== 'create-transport-request') {
					return logger.warn(`Invalid message type ${request.type}`);
				} else if (!client.routerId) {
					return send(new Response(
						request.requestId,
						undefined,
						`Client ${client.clientId} has not joined a call yet`
					));
				}

				const { role, requestId } = request;
				const router = mediasoupService.routers.get(client.routerId ?? '');
				const worker = mediasoupService.workers.get(router?.appData.workerPid ?? 0);
				const webRtcServer = worker?.appData.webRtcServer;

				let response: CreateTransportResponsePayload | undefined;
				let error: string | undefined;
				try {
					if (!router) {
						throw new Error(`Client ${client.clientId} has not joined a call yet`);
					} else if (!worker) {
						throw new Error(`Worker ${router.appData.workerPid} not found`);
					}
					if (
						(role === 'producing' && client.sndTransport) || 
						(role === 'consuming' && client.rcvTransport)
					) {
						logger.warn(`Attempted to create ${role} transport for client ${client.clientId}, userId: ${client.userId} twice`);
						return;
					}
					
					let transportOptions: mediasoup.types.WebRtcTransportOptions;
					if (webRtcServer) {
						transportOptions = {
							webRtcServer,
						};

						// also the ice candidate should be fetched here
						// port can be extracted like this:
						// webRtcServer.appData.port
					} else {
						transportOptions = {
							listenIps: [{
								ip: server.config.serverIp,
								announcedIp: server.config.announcedIp,
							}],
						};
					}
					
					logger.info(`Creating ${role} transport for client ${client.clientId}, userId: ${client.userId} with options: %o`, transportOptions);

					const transport = await router.createWebRtcTransport(transportOptions);

					transport.observer.once('close', () => {
						if (role === 'producing') client.sndTransport = undefined;
						else if (role === 'consuming') {
							client.rcvTransport = undefined;
						}
					});

					if (role === 'producing') client.sndTransport = transport;
					else if (role === 'consuming') {
						client.rcvTransport = transport;
					}
					
					logger.debug(`Transport ${transport.id} iceCandidates: %s`, JSON.stringify(transport.iceCandidates, null, 2))
					
					response = {
						dtlsParameters: transport.dtlsParameters,
						iceCandidates: transport.iceCandidates,
						iceParameters: transport.iceParameters,
						id: transport.id,
					}
				} catch (err) {
					response = undefined;
					error = `${err}`;
				}

				messageContext.send(new Response(
					requestId,
					response,
					error
				));


				if (response && role === 'consuming') {
					
					for (const [producingClientId, producingClient] of hamokService.clients.entries()) {
						if (producingClientId === client.clientId) continue;
						if (producingClient.roomId !== client.roomId) continue;
						if (producingClient.callId !== client.callId) continue;
						if (!producingClient.routerId) continue;

						const mediaProducerIds = (await hamokService.getClientProducers({
							clientId: producingClientId,
						})).mediaProducerIds;

						for (const mediaProducerId of mediaProducerIds) {
							hamokService.consumeMediaProducer({
								mediaProducerId,
								producingClientId: producingClient.clientId,
								producingUserId: producingClient.userId,
								consumingClientId: client.clientId,
								producingRouterId: producingClient.routerId,
							});
						}
					}
				}

		}
		return result;
}