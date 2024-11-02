import { createLogger } from "../common/logger";
import { Server } from "../Server";

const logger = createLogger('CloseClientInterval');

export type CloseClientIntervalContext = {
    server: Server,
    maxClientLifeTimeInMins: number,
}

export function createCloseClientInterval(context: CloseClientIntervalContext) {
    const { server, maxClientLifeTimeInMins } = context;
    const ONE_MIN = 60000;
    const maxClientLifeTimeInMs = maxClientLifeTimeInMins * ONE_MIN;
    
    return () => setInterval(() => {
        const now = Date.now();
        for (const client of server.clients.values()) {
            const elapsedTimeInMs = now - client.created;

            if (elapsedTimeInMs > maxClientLifeTimeInMs) {
                logger.debug(`Client ${client.clientId} has been alive for ${elapsedTimeInMs}ms, closing connection`);
                client.webSocket.close();
            }
        }
    }, ONE_MIN);
}