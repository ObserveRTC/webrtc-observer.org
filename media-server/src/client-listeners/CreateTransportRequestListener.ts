import { Server } from "../Server";
import { ClientContext } from "../common/ClientContext";
import { handleCreatedMediaConsumer } from "../common/CreatedConsumerHandler";
import { createLogger } from "../common/logger";
import { CreateTransportResponsePayload, Response } from "../protocols/MessageProtocol";
import { ClientMessageContext } from "./ClientMessageListener";
import { CloudSfu } from "@l7mp/cloud-sfu-client";

const logger = createLogger('CreateTransportRequestListener');

export type CreateTransportRequestListenerContext = {
		server: Server,
		// mediasoupService: MediasoupService;
		// hamokService: HamokService,
		cloudSfu: CloudSfu,
};

export function createCreateTransportRequestListener(listenerContext: CreateTransportRequestListenerContext) {
		const { 
			server,
			cloudSfu,
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
				const router = cloudSfu.routers.get(client.routerId ?? '');

				let response: CreateTransportResponsePayload | undefined;
				let error: string | undefined;
				try {
					if (!router) {
						throw new Error(`Client ${client.clientId} has not joined a call yet`);
					}
					if (
						(role === 'producing' && client.sndTransport) || 
						(role === 'consuming' && client.rcvTransport)
					) {
						logger.warn(`Attempted to create ${role} transport for client ${client.clientId}, userId: ${client.userId} twice`);
						return;
					}
					
					logger.info(`Creating ${role} transport for client ${client.clientId}, userId: ${client.userId}`);

					const modulus = router.webRtcTransports.size % 4;
					const transport = await router.createWebRtcTransport({
						appData: {
							client,
							role,
						},
						preferredRegionId: modulus < 2 ? 'local' : 'local-2',
					});

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


				if (router && response && role === 'consuming') {
					for (const mediaProducer of router.mediaProducers.values()) {
						const producingClient = mediaProducer.appData.client as ClientContext;

						if (!producingClient) continue;
						if (producingClient.clientId === client.clientId) continue;

						logger.debug(`Client ${client.clientId} consuming mediaProducer ${mediaProducer.id} from client ${producingClient.clientId} on transport ${client.rcvTransport?.id}`);
						const mediaConsumer = await client.rcvTransport?.consume({
							producerId: mediaProducer.id,
							rtpCapabilities: router.rtpCapabilities,
							paused: mediaProducer.kind === 'video',
							appData: {
								client,
							}
						});

						if (!mediaConsumer) {
							logger.warn(`Failed to consume mediaProducer ${mediaProducer.id} from client ${producingClient.clientId}.`);
							continue;
						}

						handleCreatedMediaConsumer({
							mediaConsumer,
							mediaProducer
						})
					}
				}
		}
		return result;
}