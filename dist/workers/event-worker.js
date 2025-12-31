import { parentPort, workerData } from 'node:worker_threads';
import { native } from '../native.js';
const port = parentPort;
const { client, timeoutMs } = workerData;
let running = true;
let handle = null;
port.on('message', (msg) => {
    if (msg && msg.type === 'stop') {
        running = false;
    }
});
(async () => {
    try {
        const { handle: h } = native.clientStartEvents(client);
        handle = h;
        while (running) {
            const ev = native.eventNext(h, timeoutMs);
            // If event stream indicates closure, stop the loop
            if (ev?.type === 'closed') {
                port.postMessage(ev);
                break;
            }
            port.postMessage(ev);
        }
    }
    catch (err) {
        port.postMessage({ type: 'worker_error', error: err?.message ?? String(err) });
    }
    finally {
        try {
            if (handle != null)
                native.release(handle);
        }
        catch { }
        try {
            port.close();
        }
        catch { }
    }
})().catch((err) => {
    try {
        port.postMessage({ type: 'worker_error', error: err?.message ?? String(err) });
    }
    catch { }
});
