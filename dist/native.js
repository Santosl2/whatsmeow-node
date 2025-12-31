import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import koffi from 'koffi';
function resolveDirname() {
    return path.dirname(fileURLToPath(import.meta.url));
}
function libPath() {
    const base = path.join(resolveDirname(), '..', 'build');
    if (process.platform === 'win32')
        return path.join(base, 'whatsmeow.dll');
    if (process.platform === 'darwin')
        return path.join(base, 'whatsmeow.dylib');
    return path.join(base, 'whatsmeow.so');
}
const LIB_FILE = libPath();
if (!fs.existsSync(LIB_FILE)) {
    throw new Error(`Native library not found at ${LIB_FILE}. Run: npm run build:go`);
}
const lib = koffi.load(LIB_FILE);
const mk = (ret, name, args) => lib.func(name, ret, args);
const fns = {
    WmSetLogOptions: mk('str', 'WmSetLogOptions', ['str']),
    WmOpenContainer: mk('str', 'WmOpenContainer', ['str']),
    WmNewClient: mk('str', 'WmNewClient', ['str']),
    WmClientConnect: mk('str', 'WmClientConnect', ['str']),
    WmClientGetQRChannel: mk('str', 'WmClientGetQRChannel', ['str']),
    WmQRNext: mk('str', 'WmQRNext', ['str']),
    WmClientSendPresence: mk('str', 'WmClientSendPresence', ['str']),
    WmClientSubscribePresence: mk('str', 'WmClientSubscribePresence', ['str']),
    WmClientSendChatPresence: mk('str', 'WmClientSendChatPresence', ['str']),
    WmClientUpload: mk('str', 'WmClientUpload', ['str']),
    WmClientDownloadByPath: mk('str', 'WmClientDownloadByPath', ['str']),
    WmClientGetGroupInviteLink: mk('str', 'WmClientGetGroupInviteLink', ['str']),
    WmClientStartEvents: mk('str', 'WmClientStartEvents', ['str']),
    WmEventNext: mk('str', 'WmEventNext', ['str']),
    WmClientIsLoggedIn: mk('str', 'WmClientIsLoggedIn', ['str']),
    WmClientHasStoreID: mk('str', 'WmClientHasStoreID', ['str']),
    WmClientDisconnect: mk('str', 'WmClientDisconnect', ['str']),
    WmClientWaitForConnection: mk('str', 'WmClientWaitForConnection', ['str']),
    WmRelease: mk('str', 'WmRelease', ['str']),
    WmClientCall: mk('str', 'WmClientCall', ['str']),
    WmFreeCString: mk('void', 'WmFreeCString', ['char*']),
    // Redis functions
    WmRedisConnect: mk('str', 'WmRedisConnect', ['str']),
    WmRedisDisconnect: mk('str', 'WmRedisDisconnect', ['str']),
    WmRedisSetQueueKey: mk('str', 'WmRedisSetQueueKey', ['str'])
};
function call(fn, payload) {
    const input = JSON.stringify(payload);
    // Debug markers to trace where it stops in case of crashes
    let out;
    const bound = fns[fn];
    if (bound) {
        out = bound(input);
    }
    else {
        // dynamic resolve for functions not prebound (e.g., WmContainerGetFirstDevice on some builds)
        const dyn = lib.func(fn, 'str', ['str']);
        out = dyn(input);
    }
    try {
        const json = typeof out === 'string' ? out : koffi.decode(out, 'str');
        const data = JSON.parse(json);
        if (!data.ok)
            throw new Error(data.error);
        return data.data;
    }
    finally {
        // When using 'str' return type, Koffi copies the C string, so we must not free.
        if (out && Buffer.isBuffer(out)) {
            ;
            fns.WmFreeCString(out);
        }
    }
}
export const native = {
    setLogOptions: (opts) => call('WmSetLogOptions', opts),
    openContainer: (opts) => call('WmOpenContainer', opts),
    containerGetFirstDevice: (handle) => call('WmContainerGetFirstDevice', { handle }),
    containerGetAllDevices: (handle) => call('WmContainerGetAllDevices', { handle }),
    containerGetDevice: (handle, jid) => call('WmContainerGetDevice', { handle, jid }),
    newClient: (device) => call('WmNewClient', { device }),
    clientConnect: (client) => call('WmClientConnect', { client }),
    clientHasStoreID: (client) => call('WmClientHasStoreID', { client }),
    clientGetQR: (client) => call('WmClientGetQRChannel', { client }),
    qrNext: (qr, timeoutMs) => call('WmQRNext', { handle: qr, timeoutMs }),
    clientSendPresence: (client, state) => call('WmClientSendPresence', { client, state }),
    clientSubscribePresence: (client, jid) => call('WmClientSubscribePresence', { client, jid }),
    clientSendChatPresence: (client, jid, state, media) => call('WmClientSendChatPresence', { client, jid, state, media }),
    clientUpload: (client, dataB64, type) => call('WmClientUpload', { client, data: dataB64, type }),
    clientDownloadByPath: (client, p) => call('WmClientDownloadByPath', {
        client,
        direct_path: p.direct_path,
        enc_sha256: p.enc_sha256,
        sha256: p.sha256,
        media_key: p.media_key,
        file_length: p.file_length,
        type: p.type,
        mms_type: p.mms_type ?? ''
    }),
    clientGetGroupInviteLink: (client, jid, reset) => call('WmClientGetGroupInviteLink', { client, jid, reset: !!reset }),
    clientPairPhone: (client, phone, showPushNotification, clientType, clientDisplayName) => call('WmClientCall', {
        client,
        method: 'PairPhone',
        args: [phone, !!showPushNotification, clientType, clientDisplayName]
    }),
    clientStartEvents: (client) => call('WmClientStartEvents', { client }),
    eventNext: (handle, timeoutMs) => call('WmEventNext', { handle, timeoutMs }),
    clientIsLoggedIn: (client) => call('WmClientIsLoggedIn', { client }),
    clientDisconnect: (client) => call('WmClientDisconnect', { client }),
    clientWaitForConnection: (client, timeoutMs) => call('WmClientWaitForConnection', { client, timeoutMs }),
    clientCall: (client, method, args) => call('WmClientCall', { client, method, args }),
    release: (handle) => call('WmRelease', { handle }),
    // Redis functions
    redisConnect: (opts) => call('WmRedisConnect', opts),
    redisDisconnect: () => call('WmRedisDisconnect', {}),
    redisSetQueueKey: (queueKey) => call('WmRedisSetQueueKey', { queueKey })
};
