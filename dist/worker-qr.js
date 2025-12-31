import { Worker } from 'node:worker_threads';
import { EventEmitter } from 'node:events';
export function spawnQRWorker(client, timeoutMs = 2000) {
    const handle = typeof client === 'number' ? client : client.handle;
    const workerURL = new URL('./workers/qr-worker.js', import.meta.url);
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
            emitter.emit('error', new Error(`qr worker exited with code ${code}`));
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
            await new Promise((r) => setTimeout(r, 10));
            try {
                await worker.terminate();
            }
            catch { }
        },
        worker
    };
}
