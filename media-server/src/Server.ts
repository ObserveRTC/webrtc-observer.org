import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createLogger } from "./common/logger";
import url from 'url';
import { ClientContext } from './common/ClientContext';
import { ClientMessageContext, ClientMessageListener } from './client-listeners/ClientMessageListener';
import { ClientMessage } from './protocols/MessageProtocol';
import { EventEmitter } from 'events';

const logger = createLogger('Server');

export type ServerConfig = {
    port: number,
    serverIp: string,
    announcedIp?: string,
}

export type ServerState = 'idle' | 'started' | 'run' | 'stopped' | 'aborted';

export type ServerHttpRequest = {
    request: http.IncomingMessage,
    response: http.ServerResponse<http.IncomingMessage> & {
        req: http.IncomingMessage;
    },
}

export interface ServerEvents {
    newclient: [ClientContext],
    newmessage: [ClientMessageContext],
    httprequest: [ServerHttpRequest],
}

export declare interface Server {
    on<U extends keyof ServerEvents>(
        event: U, listener: (...args: ServerEvents[U]) => void
    ): this;
    once<U extends keyof ServerEvents>(
        event: U, listener: (...args: ServerEvents[U]) => void
    ): this;
    off<U extends keyof ServerEvents>(
        event: U, listener: (...args: ServerEvents[U]) => void
    ): this;
    emit<U extends keyof ServerEvents>(
        event: U, ...args: ServerEvents[U]
    ): boolean;
}

export class Server extends EventEmitter {
    private _state: ServerState = 'idle';
    private _httpServer?: http.Server;
    private _wsServer?: WebSocketServer;

    public readonly clients = new Map<string, ClientContext>();
    public readonly messageListeners = new Map<string, ClientMessageListener>();
    public createClientContext?: (base: Pick<ClientContext, 'clientId' | 'send' | 'webSocket' | 'userId'> & { callId?: string }) => Promise<ClientContext>;

    public constructor(
        public readonly config: ServerConfig,
    ) {
        super();
    }

    public async start(): Promise<void> {
        if (this._state !== 'idle') {
            logger.warn(`Attempted to start a server in ${this._state} state. It must be in 'idle' state to perform start.`);
            return;
        }
        this._setState('started');
        logger.info(`The server is being started, state is: ${this._state}`);
        this._httpServer = await this._makeHttpServer();
        this._wsServer = await this._makeWsServer(this._httpServer!);
        await new Promise<void>(resolve => {
            this._httpServer!.listen(this.config.port, () => {
                logger.info(`Listening on ${this.config.port}`);
                resolve();
            });
        });

        this._setState('run');
    }

    public async stop(): Promise<void> {
        if (this._state !== 'run') {
            logger.warn(`Attempted to stop a server in ${this._state} state. It must be in 'run' state to perform stop.`);
            return;
        }
        this._setState('stopped');
        if (this._wsServer) {
            await new Promise<void>(resolve => {
                this._wsServer!.close(err => {
                    if (err) {
                        logger.warn(`Error while stopping websocket server`, err);
                    }
                    resolve();
                });
            });
        }
        if (this._httpServer) {
            await new Promise<void>(resolve => {
                this._httpServer!.close(err => {
                    if (err) {
                        logger.warn(`Error while stopping http server server`, err);
                    }
                    resolve();
                });
            });
        }
        this._setState('idle');
    }

    private _setState(value: ServerState): void {
        const prevState = this._state;
        this._state = value;
        logger.info(`State changed from ${prevState} to ${this._state}`);
    }

    public get state() {
        return this._state;
    }

    private async _makeHttpServer(): Promise<http.Server> {
        const result = http.createServer({
                maxHeaderSize: 8192,
                insecureHTTPParser: false,
            }
        );
        result.on('request', (request, response) => {
            const requestContext: ServerHttpRequest = {
                request,
                response,
            };
            this.emit('httprequest', requestContext);
        });
        result.once("error", err => {
            logger.error(`Server encountered an error %o`, err);
        });
        return result;
    }

    private async _makeWsServer(httpServer?: http.Server): Promise<WebSocketServer> {
        const wsServer = new WebSocketServer({
            server: httpServer,
        });

        wsServer.on('connection', async (ws, req) => {
            if (!this.createClientContext) {
                logger.error(`createClientContext is not set`);
                return ws.close(4001, 'Server error');
            }

            const query = url.parse(req.url ?? '', true).query;
            const clientId = query.clientId as string;
            // const schemaVersion = query.schemaVersion as string;
            const send = (message: ClientMessage) => {
                const data = JSON.stringify(message);
                ws.send(data);
            }
            const clientContext = await this.createClientContext({ 
                callId: typeof query.callId === 'string' ? query.callId : undefined,
                webSocket: ws, 
                clientId, 
                send, 
                userId: typeof query.userId === 'string' ? query.userId : 'unknown-user',
            });

            this.emit('newclient', clientContext);

            ws.on('message', async data => {
                const message = JSON.parse(data.toString());
                const messageContext: ClientMessageContext = {
                    client: clientContext,
                    message,
                    send,
                }
                const listener = this.messageListeners.get(message.type);

                if (!listener) return logger.warn(`No listener found for message type ${message.type}`);

                try {
                    await listener(messageContext);
                } catch (err) {
                    logger.error(`Error occurred while processing message: %o`, err);
                }
                // this.emit('newmessage', messageContext);
            });

            clientContext.webSocket.once('close', () => {
                this.clients.delete(clientId);
            });
            this.clients.set(clientId, clientContext);
            
            logger.info(`Websocket connection is requested from ${req.socket.remoteAddress}, query:`, query);
        });
        wsServer.on('error', error => {
            logger.warn("Error occurred on websocket server", error);
        });
        wsServer.on('headers', obj => {
            logger.info("Headers on websocket server", obj);
        });
        wsServer.on('close', () => {
            logger.info("Websocket connection is closed");
        });
        return wsServer;
    }
}