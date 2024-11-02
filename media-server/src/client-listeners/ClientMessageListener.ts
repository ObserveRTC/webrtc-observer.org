import { ClientContext } from "../common/ClientContext"
import { ClientMessage } from "../protocols/MessageProtocol"

export type ClientMessageContext = {
	client: ClientContext,
	message: ClientMessage,
	send: (message: ClientMessage) => void,
}
export type ClientMessageListener = (messageContext: ClientMessageContext) => void | Promise<void>