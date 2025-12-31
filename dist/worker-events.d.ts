import { Worker } from 'node:worker_threads';
import type { Client } from './client.js';
import type { ClientEvent } from './events.js';
export interface EventWorkerController {
    /** Subscribe to events coming from the worker. Returns an unsubscribe fn. */
    onEvent(cb: (ev: ClientEvent) => void): () => void;
    /** Subscribe to errors coming from the worker. Returns an unsubscribe fn. */
    onError(cb: (err: any) => void): () => void;
    /** Stop the worker and clean up resources. */
    stop(): Promise<void>;
    /** Access to the underlying Node Worker if needed. */
    worker: Worker;
}
/**
 * Spawn a dedicated worker thread that polls client events without blocking the main thread.
 * You can run many of these concurrently (one per client) safely.
 */
export declare function spawnEventWorker(client: Client | number, timeoutMs?: number): EventWorkerController;
