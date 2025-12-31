import type { JID, SendResponse, SendRequestExtra } from './types.js';
import type { proto } from './types.js';
export interface ClientMethodMap {
    SendMessage: (to: JID, message: proto.WAWebProtobufsE2E.IMessage, extra?: SendRequestExtra) => SendResponse;
    GenerateMessageID: () => string;
    BuildRevoke: (chat: JID, sender: JID, id: string) => any;
    SendPresence: (state: 'available' | 'unavailable') => {};
    SubscribePresence: (jid: JID) => {};
    SendChatPresence: (jid: JID, state: 'composing' | 'paused', media?: '' | 'audio') => {};
    GetGroupInviteLink: (jid: JID, reset?: boolean) => string;
    WaitForConnection: (timeoutMs: number) => boolean;
    IsLoggedIn: () => boolean;
    PairPhone: (phone: string, showPushNotification: boolean, clientType: number, clientDisplayName: string) => string;
    Logout: () => {};
    [method: string]: (...args: any[]) => any;
}
