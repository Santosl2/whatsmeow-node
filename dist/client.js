import { native } from './native.js';
export class Container {
    handle;
    constructor(handle) {
        this.handle = handle;
    }
    static async open(opts) {
        const { handle } = native.openContainer(opts);
        return new Container(handle);
    }
    async getFirstDevice() {
        const { handle } = native.containerGetFirstDevice(this.handle);
        return new Device(handle);
    }
    async getAllDevices() {
        const { handles } = native.containerGetAllDevices(this.handle);
        return handles.map((h) => new Device(h));
    }
    async getDevice(jid) {
        const res = native.containerGetDevice(this.handle, jid);
        if (!res.found)
            return null;
        return new Device(res.handle);
    }
    async close() {
        native.release(this.handle);
    }
}
export class Device {
    handle;
    constructor(handle) {
        this.handle = handle;
    }
}
export class QRChannel {
    handle;
    constructor(handle) {
        this.handle = handle;
    }
    async next(timeoutMs) {
        return native.qrNext(this.handle, timeoutMs);
    }
    async close() {
        native.release(this.handle);
    }
}
export class Client {
    handle;
    constructor(handle) {
        this.handle = handle;
    }
    static async create(device) {
        const { handle } = native.newClient(device.handle);
        return new Client(handle);
    }
    async connect() {
        native.clientConnect(this.handle);
    }
    async isLoggedIn() {
        const { isLoggedIn } = native.clientIsLoggedIn(this.handle);
        return isLoggedIn;
    }
    async hasStoreID() {
        const { has } = native.clientHasStoreID(this.handle);
        return has;
    }
    async waitForConnection(timeoutMs) {
        const { ok } = native.clientWaitForConnection(this.handle, timeoutMs);
        return ok;
    }
    async getQRChannel() {
        const { handle } = native.clientGetQR(this.handle);
        return new QRChannel(handle);
    }
    async send(to, message, extra) {
        if (extra)
            return this.call('SendMessage', to, message, extra);
        return this.call('SendMessage', to, message);
    }
    async pairPhone(phone, showPushNotification, clientType, clientDisplayName) {
        return this.call('PairPhone', phone, showPushNotification, clientType, clientDisplayName);
    }
    async call(method, ...args) {
        return native.clientCall(this.handle, method, args);
    }
    async sendPresence(state) {
        native.clientSendPresence(this.handle, state);
    }
    async subscribePresence(jid) {
        native.clientSubscribePresence(this.handle, jid);
    }
    async sendChatPresence(jid, state, media = '') {
        native.clientSendChatPresence(this.handle, jid, state, media);
    }
    async uploadBytes(data, type) {
        const b64 = Buffer.from(data).toString('base64');
        return native.clientUpload(this.handle, b64, type);
    }
    async downloadByPath(params) {
        const { data } = native.clientDownloadByPath(this.handle, params);
        return Buffer.from(data, 'base64');
    }
    async getGroupInviteLink(jid, reset = false) {
        const { link } = native.clientGetGroupInviteLink(this.handle, jid, reset);
        return link;
    }
    async disconnect() {
        native.clientDisconnect(this.handle);
    }
    events(timeoutMs = 60000) {
        const self = this;
        return {
            [Symbol.asyncIterator]() {
                let closed = false;
                let h = null;
                const ensure = () => {
                    if (h === null) {
                        const { handle } = native.clientStartEvents(self.handle);
                        h = handle;
                    }
                };
                return {
                    async next() {
                        if (closed)
                            return { done: true, value: undefined };
                        ensure();
                        const ev = native.eventNext(h, timeoutMs);
                        if (ev.type === 'closed') {
                            closed = true;
                            return { done: true, value: undefined };
                        }
                        if (ev.type === 'timeout') {
                            // synthesize no-op on timeout; keep waiting on next()
                            return this.next();
                        }
                        return { done: false, value: ev };
                    },
                    async return() {
                        if (h != null) {
                            try {
                                native.release(h);
                            }
                            catch { }
                        }
                        closed = true;
                        return { done: true, value: undefined };
                    },
                    async throw(err) {
                        closed = true;
                        return Promise.reject(err);
                    }
                };
            }
        };
    }
}
export async function openContainer(opts) {
    return Container.open(opts);
}
