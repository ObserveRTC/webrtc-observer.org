import { CloudSfu, Router } from "@l7mp/cloud-sfu-client";
import { createLogger } from "../common/logger";
import { JoinCallResponsePayload, Response } from "../protocols/MessageProtocol";
import { ClientMessageContext } from "./ClientMessageListener";

const logger = createLogger('JoinCallRequestListener');

export type JoinCallRequestListenerContext = {
		// mediasoupService: MediasoupService;
		// hamokService: HamokService,
		maxTransportsPerRouter: number;
		clientMaxLifetimeInMs: number;
		// stunnerAuthUrl?: string;
		cloudSfu: CloudSfu,
}

type TurnServerConfig = {
	password: string;
	ttl: number;
	uris: string[];
	username: string;
  };

export function createJoinCallRequestListener(listenerContext: JoinCallRequestListenerContext) {
		const { 
			// mediasoupService,
			// hamokService,
			// stunnerAuthUrl,
			clientMaxLifetimeInMs,
			cloudSfu
		} = listenerContext;
		
		const result = async (messageContext: ClientMessageContext) => {
				const {
					message: request,
					client,
				} = messageContext;
				
				if (request.type !== 'join-call-request') {
					return logger.warn(`Invalid message type ${request.type}`);
				} else if (client.routerId) {
					return messageContext.send(new Response(
						request.requestId,
						undefined,
						`Client ${client.clientId} already joined a call`
					));
				}

				let error: string | undefined;
				let response: JoinCallResponsePayload | undefined;
				let closeClient = false;

				try {
					let router: Router | undefined;

					// logger.debug('Join call request: %s', JSON.stringify(request, null, 2));

					if (request.callId) {
						router = [ ...cloudSfu.routers.values() ].find(router => router.appData.callId === request.callId);
						
						if (!router) throw new Error(`Call ${request.callId} not found`);
						
						if (router.webRtcTransports.size >= listenerContext.maxTransportsPerRouter) {
							closeClient = true;
							throw new Error(`Max transports per call reached`);
						}

						client.callId = request.callId;
						client.roomId = router.appData.roomId as string;
						client.routerId = router.id;
	
						logger.info(`Client ${client.clientId} changed room and call to ${client.callId}, room: ${client.roomId}.`);
					} else {
						router = await cloudSfu.createRouter({
							appData: {
								roomId: client.roomId,
								callId: client.callId,
							},
						});
						client.routerId = router.id;
					}
					
					logger.debug('Client %s joined call %s, routerId: %s', client.clientId, client.callId, client.routerId);

					if (!router) throw new Error(`Failed to create router`);

					
					// logger.debug('router.rtpCapabilities: %s', JSON.stringify(router.rtpCapabilities, null, 2));

					response = {
						callId: client.callId,
						rtpCapabilities: router.rtpCapabilities,
						// iceServers: turnConfig ? [{
						// 	credential: turnConfig.password,
						// 	credentialType: 'password',
						// 	urls: turnConfig.uris,
						// 	username: turnConfig.username,
						// }] : [],
						clientCreatedServerTimestamp: client.created,
						// innerServerIp: mediasoupService.announcedAddress,
						innerServerIp: '127.0.0.1', // its for the graph to visualize the connection
						clientMaxLifetimeInMs,
					};
				} catch (err) {
					error = `${err}`;
					response = undefined;
				}

				messageContext.send(new Response(
					request.requestId,
					response,
					error
				));

				if (closeClient) {
					client.webSocket.close();
				}
		};
		return result;
}