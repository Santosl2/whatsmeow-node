import { Worker } from 'node:worker_threads';
import { EventEmitter } from 'node:events';
/**
 * Spawn a dedicated worker thread that polls client events without blocking the main thread.
 * You can run many of these concurrently (one per client) safely.
 */
export function spawnEventWorker(client, timeoutMs = 500) {
    const handle = typeof client === 'number' ? client : client.handle;
    const workerURL = new URL('./workers/event-worker.js', import.meta.url);
    const worker = new Worker(workerURL, {
        workerData: { client: handle, timeoutMs },
        type: 'module'
    });
    const emitter = new EventEmitter();
    const onMessage = (msg) => {
        if (msg && msg.type === 'worker_error') {
            emitter.emit('error', new Error(msg.error));
        }
        else {
            emitter.emit('event', msg);
        }
    };
    const onError = (err) => emitter.emit('error', err);
    worker.on('message', onMessage);
    worker.on('error', onError);
    worker.on('exit', (code) => {
        if (code !== 0)
            emitter.emit('error', new Error(`event worker exited with code ${code}`));
    });
    return {
        onEvent(cb) {
            emitter.on('event', cb);
            return () => emitter.off('event', cb);
        },
        onError(cb) {
            emitter.on('error', cb);
            return () => emitter.off('error', cb);
        },
        async stop() {
            try {
                worker.postMessage({ type: 'stop' });
            }
            catch { }
            // Give the worker a tick to cleanly finish
            await new Promise((r) => setTimeout(r, 10));
            try {
                await worker.terminate();
            }
            catch { }
        },
        worker
    };
}
