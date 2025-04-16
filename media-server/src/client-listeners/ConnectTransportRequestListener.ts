import { CloudSfu } from "@l7mp/cloud-sfu-client";
import { createLogger } from "../common/logger";
import { ConnectTransportResponsePayload, Response } from "../protocols/MessageProtocol";
import { ClientMessageContext } from "./ClientMessageListener";

const logger = createLogger('ConnectTransportRequestListener');

export type ConnectTransportRequestListenerContext = {
}

export function createConnectTransportRequestListener(listenerContext: ConnectTransportRequestListenerContext) {
		const { 
		} = listenerContext;
		
		const result = async (messageContext: ClientMessageContext) => {
				const { 
					client,
					message: request,
				} = messageContext;
				
				if (request.type !== 'connect-transport-request') {
					return logger.warn(`Invalid message type ${request.type}`);
				}

				let response: ConnectTransportResponsePayload | undefined;
				let error: string | undefined;
				
				try {
					const transport = request.transportId === client.sndTransport?.id 
						? client.sndTransport 
						: request.transportId === client.rcvTransport?.id
						? client.rcvTransport
						: undefined;
					
					if (!transport) {
						throw new Error(`Transport ${request.transportId} not found`);
					}

					await transport.connect({
						dtlsParameters: request.dtlsParameters,
					});

					response = {

					};
					
					logger.info(`Client ${client.clientId} connected transport ${transport.id}`);

				} catch (err) {
					response = undefined;
					error = `${err}`;
				}

				messageContext.send(new Response(
					request.requestId,
					response,
					error
				));
		};
		return result;
}