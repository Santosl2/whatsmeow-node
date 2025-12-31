import { native } from './native.js';
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
export function redisConnect(opts) {
    return native.redisConnect(opts);
}
/**
 * Disconnect from Redis server.
 *
 * After disconnecting, message events will no longer be published to Redis.
 */
export function redisDisconnect() {
    return native.redisDisconnect();
}
/**
 * Change the Redis queue key for message events.
 *
 * @param queueKey - The new queue key to use
 */
export function redisSetQueueKey(queueKey) {
    return native.redisSetQueueKey(queueKey);
}
