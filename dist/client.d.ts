import { Handle, JID, OpenContainerOptions, QREvent, SendResponse } from './types.js';
import type * as proto from '../proto/whatsmeow.js';
import type { SendRequestExtra } from './types.js';
import type { ClientEvent } from './events.js';
import type { ClientMethodMap } from './methods.js';
export declare class Container {
    readonly handle: Handle;
    constructor(handle: Handle);
    static open(opts: OpenContainerOptions): Promise<Container>;
    getFirstDevice(): Promise<Device>;
    getAllDevices(): Promise<Device[]>;
    getDevice(jid: JID): Promise<Device | null>;
    close(): Promise<void>;
}
export declare class Device {
    readonly handle: Handle;
    constructor(handle: Handle);
}
export declare class QRChannel {
    readonly handle: Handle;
    constructor(handle: Handle);
    next(timeoutMs: number): Promise<QREvent>;
    close(): Promise<void>;
}
export declare class Client {
    readonly handle: Handle;
    private constructor();
    static create(device: Device): Promise<Client>;
    connect(): Promise<void>;
    isLoggedIn(): Promise<boolean>;
    hasStoreID(): Promise<boolean>;
    waitForConnection(timeoutMs: number): Promise<boolean>;
    getQRChannel(): Promise<QRChannel>;
    send(to: JID, message: proto.WAWebProtobufsE2E.IMessage, extra?: SendRequestExtra): Promise<SendResponse>;
    pairPhone(phone: string, showPushNotification: boolean, clientType: number, clientDisplayName: string): Promise<string>;
    call<K extends keyof ClientMethodMap>(method: K, ...args: Parameters<ClientMethodMap[K]>): Promise<Awaited<ReturnType<ClientMethodMap[K]>>>;
    call<T = any>(method: string, ...args: any[]): Promise<T>;
    sendPresence(state: 'available' | 'unavailable'): Promise<void>;
    subscribePresence(jid: JID): Promise<void>;
    sendChatPresence(jid: JID, state: 'composing' | 'paused', media?: '' | 'audio'): Promise<void>;
    uploadBytes(data: Buffer | Uint8Array, type: 'image' | 'video' | 'audio' | 'document' | 'history' | 'appstate' | 'sticker-pack' | 'thumbnail-link'): Promise<any>;
    downloadByPath(params: {
        direct_path: string;
        enc_sha256: string;
        sha256: string;
        media_key: string;
        file_length: number;
        type: 'image' | 'video' | 'audio' | 'document' | 'history' | 'appstate' | 'sticker-pack' | 'thumbnail-link';
        mms_type?: string;
    }): Promise<Buffer>;
    getGroupInviteLink(jid: JID, reset?: boolean): Promise<string>;
    disconnect(): Promise<void>;
    events(timeoutMs?: number): AsyncIterable<ClientEvent>;
}
export declare function openContainer(opts: OpenContainerOptions): Promise<Container>;
