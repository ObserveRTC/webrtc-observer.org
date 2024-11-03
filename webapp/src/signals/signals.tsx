import { createSignal } from 'solid-js';

export type Page = 
    | 'main'
    | 'lobby' 
    | 'stunner'
    | 'videoCall' 
    | 'client-monitor-properties'
    | 'ice-connection-page'
    | 'exit' 
    | 'observer';

export const [ page, setPage ] = createSignal<Page>('main');

export type MediaResults = 'tcp' | 'relay' | 'bw' | 'loss' | 'latency' | 'connection';
