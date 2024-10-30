import { ClientContext } from "../common/ClientContext";
import { createLogger } from "../common/logger";
import { JoinCallResponsePayload, Response } from "../protocols/MessageProtocol";
import { MediasoupService, RouterAppData } from "../services/MediasoupService"
import { ClientMessageContext } from "./ClientMessageListener";
import * as mediasoup from 'mediasoup';

const logger = createLogger('JoinCallRequestListener');

export type JoinCallRequestListenerContext = {
		mediasoupService: MediasoupService;
		clients: Map<string, ClientContext>;
		maxTransportsPerRouter: number;
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
			clients,
		} = listenerContext;
		
		const result = async (messageContext: ClientMessageContext) => {
				const { 
					message: request,
				} = messageContext;
				const client = clients.get(messageContext.clientId);
				if (request.type !== 'join-call-request') {
					return console.warn(`Invalid message type ${request.type}`);
				} else if (!client) {
					return console.warn(`Client ${messageContext.clientId} not found`);
				}

				logger.debug(`Client ${client.clientId} joining call ${request.callId}. request: %o`, request);

				let closeClient = false;
				let response: JoinCallResponsePayload | undefined;
				let error: string | undefined;
				
				try {
					let router: mediasoup.types.Router<RouterAppData> | undefined;

					if (request.callId) {
						router = mediasoupService.calls.get(request.callId);
						if (!router) throw new Error(`Call with id ${request.callId} does not exist`);
					} else {
						router = await mediasoupService.createRouter();
					}

					if (listenerContext.maxTransportsPerRouter <= router.appData.transports.size) {
						closeClient = true;
						throw new Error(`Max transports per router reached`);
					}

					client.routerId = router.id;

					const turnResponse = await (await fetch(`http://stunner-auth.stunner-system:8088?service=turn`)).json();
					const turnConfig = (await turnResponse) as TurnServerConfig;

					logger.info(`Turn response: %o`, turnConfig);
					
					// http://stunner-auth.stunner-system:8088?service=turn

					response = {
						callId: router.id,
						rtpCapabilities: router.rtpCapabilities,
						iceServers: [{
							credential: turnConfig.password,
							credentialType: 'password',
							urls: turnConfig.uris,
							username: turnConfig.username,
						}],
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