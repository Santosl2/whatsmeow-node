/**
 * Example: Redis queue consumer for WhatsApp messages
 *
 * This is a simple example of how to consume messages from the Redis queue
 * that are published by the whatsmeow-node bridge.
 *
 * Run: npx tsx examples/redis-consumer.ts
 *
 * Note: This requires the 'ioredis' package:
 *   npm install ioredis
 */

import { Redis } from 'ioredis'
import type { RedisMessageEvent } from '../redis.js'

// Configuration
const REDIS_ADDR = process.env.REDIS_ADDR || 'localhost:6379'
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined
const REDIS_QUEUE_KEY = process.env.REDIS_QUEUE_KEY || 'whatsmeow:messages'

async function main() {
    console.log('🚀 Starting Redis consumer...')

    // Parse Redis address
    const [host, port] = REDIS_ADDR.split(':')

    const redis = new Redis({
        host: host || 'localhost',
        port: parseInt(port) || 6379,
        password: REDIS_PASSWORD
    })

    console.log(`📡 Connected to Redis at ${REDIS_ADDR}`)
    console.log(`👂 Listening for messages on queue: ${REDIS_QUEUE_KEY}`)
    console.log('💡 Press Ctrl+C to stop\n')

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n👋 Shutting down...')
        await redis.quit()
        process.exit(0)
    })

    // Consume messages using BRPOP (blocking right pop)
    while (true) {
        try {
            // BRPOP blocks until a message is available (timeout 0 = infinite)
            const result = await redis.brpop(REDIS_QUEUE_KEY, 0)

            if (result) {
                const [_key, data] = result
                const message: RedisMessageEvent = JSON.parse(data)

                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
                console.log(`📨 New message from client: ${message.clientJid}`)
                console.log(`📅 Timestamp: ${new Date(message.timestamp).toISOString()}`)
                console.log(`📋 Event type: ${message.event.type}`)

                // Handle different event types
                switch (message.event.type) {
                    case 'message':
                        handleWhatsAppMessage(message)
                        break
                    case 'receipt':
                        handleReceipt(message)
                        break
                    case 'presence':
                        handlePresence(message)
                        break
                    case 'chat_presence':
                        handleChatPresence(message)
                        break
                    default:
                        console.log(`📄 Event data:`, JSON.stringify(message.event, null, 2))
                }
            }
        } catch (error) {
            console.error('❌ Error consuming message:', error)
            // Wait a bit before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }
    }
}

function handleWhatsAppMessage(message: RedisMessageEvent) {
    const event = message.event
    const info = event.info || {}

    console.log(`👤 From: ${info.Sender || info.Chat || 'unknown'}`)
    console.log(`💬 Chat: ${info.Chat || 'unknown'}`)
    console.log(`🕐 Message time: ${info.Timestamp || 'unknown'}`)

    // Extract text content if available
    const messageContent = event.message
    if (messageContent) {
        if (messageContent.conversation) {
            console.log(`📝 Text: ${messageContent.conversation}`)
        } else if (messageContent.extendedTextMessage?.text) {
            console.log(`📝 Text: ${messageContent.extendedTextMessage.text}`)
        } else if (messageContent.imageMessage) {
            console.log(
                `🖼️ Image message with caption: ${messageContent.imageMessage.caption || '(no caption)'}`
            )
        } else if (messageContent.videoMessage) {
            console.log(
                `🎬 Video message with caption: ${messageContent.videoMessage.caption || '(no caption)'}`
            )
        } else if (messageContent.documentMessage) {
            console.log(`📄 Document: ${messageContent.documentMessage.fileName || 'unknown'}`)
        } else if (messageContent.audioMessage) {
            console.log(`🎵 Audio message`)
        } else if (messageContent.stickerMessage) {
            console.log(`🎨 Sticker message`)
        } else {
            console.log(`📦 Message type: ${Object.keys(messageContent).join(', ')}`)
        }
    }

    // Here you can add your business logic:
    // - Save to database
    // - Send notification
    // - Trigger automation
    // - etc.
}

function handleReceipt(message: RedisMessageEvent) {
    const event = message.event
    console.log(`✓ Receipt type: ${event.receipt_type}`)
    console.log(`📨 Message IDs: ${event.message_ids?.join(', ') || 'unknown'}`)
    console.log(`👤 From: ${event.message_sender || 'unknown'}`)
}

function handlePresence(message: RedisMessageEvent) {
    const event = message.event
    console.log(`👤 User: ${event.from}`)
    console.log(`🟢 Status: ${event.unavailable ? 'offline' : 'online'}`)
    if (event.last_seen) {
        console.log(`🕐 Last seen: ${event.last_seen}`)
    }
}

function handleChatPresence(message: RedisMessageEvent) {
    const event = message.event
    console.log(`💬 Chat: ${event.chat}`)
    console.log(`👤 User: ${event.sender}`)
    console.log(`✍️ State: ${event.state}`) // e.g., "composing", "paused"
    if (event.media) {
        console.log(`📱 Media: ${event.media}`) // e.g., "audio" for voice recording
    }
}

main().catch(console.error)
