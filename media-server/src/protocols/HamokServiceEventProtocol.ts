import * as mediasoup from 'mediasoup';
import { ObserverGetCallStatsResponse } from './MessageProtocol';

export type HamokServiceCreatePipeTransportResponsePayload = {
    ip: string;
    port: number;
};export type HamokServiceCreatePipeTransportRequestPayload = {
    srcRouterId: string;
    dstRouterId: string;
};
export type HamokServiceClientSampleEventPayload = {
    clientId: string;
    callId: string;
    mediaUnitId: string;
    roomId: string;
    sampleInBase64: string;
    serviceId: string;
    userId?: string;
    schemaVersion?: string;
};

export type HamokServicePipeMediaConsumerClosedEventPayload = {
    mediaProducerId: string;
};

export type HamokServiceGetCallStatsRequestPayload = {

}

export type HamokServiceGetCallStatsResponsePayload = ObserverGetCallStatsResponse;

export type HamokServiceConnectPipeTransportRequestPayload = {
    srcRouterId: string;
    dstRouterId: string;
    ip: string;
    port: number;
};
export type HamokServicePipeMediaProducerToRequestPayload = {
    srcRouterId: string;
    dstRouterId: string;
    mediaProducerId: string;
};
export type HamokServiceConnectPipeTransportResponsePayload = void;
export type HamokServiceResponseField<T> = T extends void ? ((err?: string) => void) : ((payload?: T, error?: string) => void);
export type HamokServiceConsumeMediaProducerEventPayload = {
    producingRouterId: string;
    mediaProducerId: string;
    consumingClientId: string;
    producingClientId: string;
    producingUserId?: string;
};
export type HamokServiceGetClientProducersRequestPayload = {
    clientId: string;
};
export type HamokServiceGetClientProducersResponsePayload = {
    mediaProducerIds: string[];
};

export type HamokServicePipeMediaProducerToResponsePayload = mediasoup.types.ProducerOptions;


