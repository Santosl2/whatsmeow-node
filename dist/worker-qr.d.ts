import { Worker } from 'node:worker_threads';
import type { Client } from './client.js';
export interface QRWorkerController {
    onEvent(cb: (ev: any) => void): () => void;
    onError(cb: (err: any) => void): () => void;
    stop(): Promise<void>;
    worker: Worker;
}
export declare function spawnQRWorker(client: Client | number, timeoutMs?: number): QRWorkerController;
