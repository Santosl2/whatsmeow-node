export declare const native: {
    setLogOptions: (opts: {
        database?: string;
        client?: string;
        color?: boolean;
    }) => {};
    openContainer: (opts: {
        dialect: string;
        address: string;
    }) => {
        handle: number;
    };
    containerGetFirstDevice: (handle: number) => {
        handle: number;
    };
    containerGetAllDevices: (handle: number) => {
        handles: number[];
    };
    containerGetDevice: (handle: number, jid: string) => {
        handle: number;
        found: boolean;
    };
    newClient: (device: number) => {
        handle: number;
    };
    clientConnect: (client: number) => {};
    clientHasStoreID: (client: number) => {
        has: boolean;
    };
    clientGetQR: (client: number) => {
        handle: number;
    };
    qrNext: (qr: number, timeoutMs: number) => any;
    clientSendPresence: (client: number, state: string) => {};
    clientSubscribePresence: (client: number, jid: string) => {};
    clientSendChatPresence: (client: number, jid: string, state: string, media: string) => {};
    clientUpload: (client: number, dataB64: string, type: string) => any;
    clientDownloadByPath: (client: number, p: {
        direct_path: string;
        enc_sha256: string;
        sha256: string;
        media_key: string;
        file_length: number;
        type: string;
        mms_type?: string;
    }) => {
        data: string;
    };
    clientGetGroupInviteLink: (client: number, jid: string, reset?: boolean) => {
        link: string;
    };
    clientPairPhone: (client: number, phone: string, showPushNotification: boolean, clientType: number, clientDisplayName: string) => string;
    clientStartEvents: (client: number) => {
        handle: number;
    };
    eventNext: (handle: number, timeoutMs: number) => any;
    clientIsLoggedIn: (client: number) => {
        isLoggedIn: boolean;
    };
    clientDisconnect: (client: number) => {};
    clientWaitForConnection: (client: number, timeoutMs: number) => {
        ok: boolean;
    };
    clientCall: (client: number, method: string, args: any) => any;
    release: (handle: number) => {};
    redisConnect: (opts: {
        addr: string;
        password?: string;
        db?: number;
        queueKey?: string;
    }) => {
        connected: boolean;
        queueKey: string;
    };
    redisDisconnect: () => {
        disconnected: boolean;
    };
    redisSetQueueKey: (queueKey: string) => {
        queueKey: string;
    };
};
