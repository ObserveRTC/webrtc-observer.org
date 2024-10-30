import fs from 'fs';
import YAML from 'yaml';
import type { MediasoupServiceConfig } from './services/MediasoupService';
import type { ServerConfig } from './Server';

export type Config = {
    configPath?: string;
    server: ServerConfig,
    mediasoup: MediasoupServiceConfig;
    maxTransportsPerRouter: number;
    maxProducerPerClients: number;
};

const getDefaultConfig: () => Config = () => {
	const config: Config = {
        server: {
            port: 9080,
            serverIp: '127.0.0.1',
            // announcedIp: '127.0.0.1',
        },
        maxTransportsPerRouter: 6,
        maxProducerPerClients: 1,
        mediasoup: {
            numberOfWorkers: 1,
            workerSettings: {
                logLevel: 'warn',
                logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
                rtcMinPort: 40000,
                rtcMaxPort: 41000,
            },
            mediaCodecs: [
                {
                    kind: 'audio',
                    mimeType: 'audio/opus',
                    clockRate: 48000,
                    channels: 2
                },
                {
                    kind: 'video',
                    mimeType: 'video/VP8',
                    clockRate: 90000,
                },
            ],
            webRtcServerSettings: [
                {
                    listenInfos: [
                        {
                            ip: '127.0.0.1',
                            // ip: '0.0.0.0',
                            protocol: 'udp',
                            // announcedAddress: '127.0.0.1',
                            port: 5000
                        },
                    ]
                }
            ]
        }
	};
	
	return config;
};

export const config: Config = (() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const argv = require('yargs-parser')(process.argv.slice(2));
	const result = getDefaultConfig();
	const configPath = process.env['CONFIG_PATH'] ?? argv['config'];

	if (configPath) {
		const fileContent = fs.readFileSync(configPath, 'utf-8');

        result.configPath = configPath;
		Object.assign(result, YAML.parse(fileContent));
	}
	
	return result;
})();

export function getConfigString(): string {
	const deepCopy = JSON.parse(JSON.stringify(config)) as Config;
	
	return JSON.stringify(deepCopy, null, 2);
}
