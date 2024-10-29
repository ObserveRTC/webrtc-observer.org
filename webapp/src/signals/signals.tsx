import { createSignal } from 'solid-js';

export type Page = 
    | 'lobby' 
    | 'stunner'
    | 'videoCall' 
    | 'clientMonitor'
    | 'exit' 
    | 'observer';

export const [ page, setPage ] = createSignal<Page>('lobby');

export type MediaResults = 'tcp' | 'relay' | 'bw' | 'loss' | 'latency' | 'connection';
