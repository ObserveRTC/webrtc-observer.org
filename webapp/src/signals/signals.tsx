import { createSignal } from 'solid-js';

export type Page = 
    | 'main'
    | 'lobby' 
    | 'stunner'
    | 'videoCall' 
    | 'clientMonitor'
    | 'exit' 
    | 'observer';

export const [ page, setPage ] = createSignal<Page>('main');

export type MediaResults = 'tcp' | 'relay' | 'bw' | 'loss' | 'latency' | 'connection';
