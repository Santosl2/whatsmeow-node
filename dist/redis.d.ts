export interface RedisConnectOptions {
    username?: string;
    /** Redis address, e.g. "localhost:6379" */
    addr: string;
    /** Redis password (optional) */
    password?: string;
    /** Redis database number (optional, defaults to 0) */
    db?: number;
    /** Queue key for message events (optional, defaults to "whatsmeow:messages") */
    queueKey?: string;
}
export interface RedisMessageEvent {
    /** The JID of the WhatsApp client that received the message */
    clientJid: string;
    /** The event data */
    event: {
        type: string;
        [key: string]: any;
    };
    /** Timestamp in milliseconds */
    timestamp: number;
}
/**
 * Connect to Redis server for publishing message events.
 *
 * Once connected, all incoming messages from WhatsApp clients will be
 * automatically published to the specified Redis queue using LPUSH.
 *
 * Your backend can consume messages using BRPOP or RPOP on the queue key.
 *
 * @example
 * ```typescript
 * import { redisConnect } from 'whatsmeow-node'
 *
 * // Connect to Redis
 * await redisConnect({
 *   addr: 'localhost:6379',
 *   password: 'your-password', // optional
 *   db: 0, // optional
 *   queueKey: 'whatsmeow:messages' // optional
 * })
 * ```
 */
export declare function redisConnect(opts: RedisConnectOptions): {
    connected: boolean;
    queueKey: string;
};
/**
 * Disconnect from Redis server.
 *
 * After disconnecting, message events will no longer be published to Redis.
 */
export declare function redisDisconnect(): {
    disconnected: boolean;
};
/**
 * Change the Redis queue key for message events.
 *
 * @param queueKey - The new queue key to use
 */
export declare function redisSetQueueKey(queueKey: string): {
    queueKey: string;
};
