import { ClientContext } from "../common/ClientContext";
import { createLogger } from "../common/logger";
import { JoinCallResponsePayload, Response } from "../protocols/MessageProtocol";
import { HamokService } from "../services/HamokService";
import { MediasoupService, RouterAppData } from "../services/MediasoupService"
import { ClientMessageContext } from "./ClientMessageListener";
import * as mediasoup from 'mediasoup';

const logger = createLogger('JoinCallRequestListener');

export type JoinCallRequestListenerContext = {
		mediasoupService: MediasoupService;
		hamokService: HamokService,
		maxTransportsPerRouter: number;
		clientMaxLifetimeInMs: number;
		stunnerAuthUrl?: string;
}

type TurnServerConfig = {
	password: string;
	ttl: number;
	uris: string[];
	username: string;
  };

export function createJoinCallRequestListener(listenerContext: JoinCallRequestListenerContext) {
		const { 
			mediasoupService,
			hamokService,
			stunnerAuthUrl,
			clientMaxLifetimeInMs,
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

				if (request.callId) {
					const ongoingCall = hamokService.calls.get(request.callId);
					if (!ongoingCall) {
						return messageContext.send(new Response(
							request.requestId,
							undefined,
							`Call ${request.callId} not found`
						));
					}
					client.callId = request.callId;
					client.roomId = ongoingCall.roomId;

					logger.info(`Client ${client.clientId} changed room and call to ${client.callId}, room: ${client.roomId}.`);
				}

				logger.debug(`Client ${client.clientId} (${client.userId}) joining call ${client.callId}, room: ${client.roomId}. request: %o`, request);

				let closeClient = false;
				let response: JoinCallResponsePayload | undefined;
				let error: string | undefined;
				
				try {
					let router = [ ...mediasoupService.routers.values() ].find(router => router.appData.callId === client.callId);

					if (!router) {
						router = await mediasoupService.createRouter(client.callId);
					}

					client.routerId = router.id;

					if (listenerContext.maxTransportsPerRouter <= router.appData.transports.size) {
						closeClient = true;
						throw new Error(`Max transports per router reached`);
					}

					let turnConfig: TurnServerConfig | undefined;
					try {
						if (stunnerAuthUrl) {
							const turnResponse = await (await fetch(stunnerAuthUrl)).json();
							turnConfig = (await turnResponse) as TurnServerConfig;

							logger.info(`Turn response: %o`, turnConfig);
						}
					} catch (err) {
						logger.error(`Failed to fetch turn server config: %o`, err);
						turnConfig = undefined;
					}
					
					if (!turnConfig) {
						logger.warn(`No turn server config available`);
					}
					
					await hamokService.joinClient({
						callId: client.callId,
						clientId: client.clientId,
						roomId: client.roomId,
						routerId: router.id,
						userId: client.userId,
					})

					response = {
						callId: client.callId,
						rtpCapabilities: router.rtpCapabilities,
						iceServers: turnConfig ? [{
							credential: turnConfig.password,
							credentialType: 'password',
							urls: turnConfig.uris,
							username: turnConfig.username,
						}] : [],
						clientCreatedServerTimestamp: client.created,
						innerServerIp: mediasoupService.announcedAddress,
						clientMaxLifetimeInMs,
					};

					logger.info(`Client ${client.clientId} joined call ${router.id}`);

				} catch (err) {
					response = undefined;
					error = `${err}`;
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