import { parentPort, workerData } from 'node:worker_threads';
import { native } from '../native.js';
const port = parentPort;
const { client, timeoutMs } = workerData;
let running = true;
let qrHandle = null;
port.on('message', (msg) => {
    if (msg && msg.type === 'stop')
        running = false;
});
(async () => {
    try {
        // If the Store already has a user ID, QR flow is invalid.
        const { has } = native.clientHasStoreID(client);
        if (has) {
            port.postMessage({ event: 'skipped', reason: 'store_has_user_id' });
            return;
        }
        const { handle } = native.clientGetQR(client);
        qrHandle = handle;
        while (running) {
            const ev = native.qrNext(handle, timeoutMs);
            port.postMessage(ev);
            // Stop loop if QR finished
            if (ev?.event && (ev.event === 'success' || ev.event === 'closed'))
                break;
        }
    }
    catch (err) {
        port.postMessage({ type: 'worker_error', error: err?.message ?? String(err) });
    }
    finally {
        try {
            if (qrHandle != null)
                native.release(qrHandle);
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
