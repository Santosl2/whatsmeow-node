/**
 * Example: Multi-tenant WhatsApp with Redis queue
 *
 * This example shows how to:
 * 1. Connect multiple WhatsApp clients
 * 2. Automatically publish all incoming messages to a Redis queue (no loop required!)
 * 3. Consume messages from the queue in your backend
 *
 * Run: npx tsx examples/multi-tenant-redis.ts
 */
import { openContainer, Client, redisConnect, redisDisconnect } from '../index.js';
// Configuration
const REDIS_ADDR = process.env.REDIS_ADDR || 'localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';
const REDIS_QUEUE_KEY = process.env.REDIS_QUEUE_KEY || 'whatsmeow:messages';
const DB_PATH = process.env.DB_PATH || './whatsmeow.db';
async function main() {
    console.log('🚀 Starting multi-tenant WhatsApp bridge with Redis...');
    // 1. Connect to Redis first
    console.log(`📡 Connecting to Redis at ${REDIS_ADDR}...`);
    const redisResult = redisConnect({
        addr: REDIS_ADDR,
        password: REDIS_PASSWORD,
        username: 'default',
        queueKey: REDIS_QUEUE_KEY
    });
    console.log(`✅ Redis connected! Queue key: ${redisResult.queueKey}`);
    // 2. Open database container
    console.log(`📂 Opening database at ${DB_PATH}...`);
    const container = await openContainer({
        dialect: 'sqlite3',
        address: `file:${DB_PATH}?_foreign_keys=on`
    });
    // 3. Get all existing devices or create first one
    const devices = await container.getAllDevices();
    console.log(`📱 Found ${devices.length} existing device(s)`);
    const clients = [];
    if (devices.length === 0) {
        // Create first device and show QR
        console.log('📲 No devices found. Creating new device...');
        const device = await container.getFirstDevice();
        const client = await Client.create(device);
        // Get QR code before connecting
        const qr = await client.getQRChannel();
        // Connect (this triggers QR generation)
        await client.connect();
        console.log('📱 Scan this QR code with WhatsApp:');
        let paired = false;
        while (!paired) {
            const item = await qr.next(60000);
            switch (item.event) {
                case 'code':
                    console.log(`\nQR Code: ${item.code}\n`);
                    break;
                case 'success':
                    console.log('✅ Paired successfully!');
                    paired = true;
                    break;
                case 'timeout':
                    console.log('⏰ QR timeout, getting new code...');
                    break;
                case 'error':
                    console.error('❌ QR Error:', item.error);
                    process.exit(1);
            }
        }
        // Wait for connection
        const connected = await client.waitForConnection(30000);
        if (connected) {
            console.log('✅ Connected to WhatsApp!');
            clients.push(client);
        }
    }
    else {
        // Connect all existing devices
        console.log('📲 Connecting existing devices...');
        for (const device of devices) {
            const client = await Client.create(device);
            await client.connect();
            const connected = await client.waitForConnection(30000);
            if (connected) {
                const loggedIn = await client.isLoggedIn();
                console.log(`✅ Client connected: ${loggedIn ? 'logged in' : 'not logged in'}`);
                clients.push(client);
            }
            else {
                console.log(`⚠️ Client failed to connect within timeout`);
            }
        }
    }
    // 4. Enable auto Redis publishing for all clients
    // Messages will be automatically published to Redis without needing an event loop!
    for (const client of clients) {
        await client.enableAutoRedis();
    }
    console.log(`\n📤 Auto Redis publishing enabled for ${clients.length} client(s)`);
    console.log(`📨 All incoming messages will be automatically published to: ${REDIS_QUEUE_KEY}`);
    console.log('💡 No event loop required - messages are published in the background!');
    console.log('\n⏳ Press Ctrl+C to stop\n');
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n👋 Shutting down...');
        for (const client of clients) {
            await client.disableAutoRedis();
            await client.disconnect();
        }
        redisDisconnect();
        process.exit(0);
    });
    // Keep the process alive - no event loop needed!
    // The Go bridge handles everything in the background
    await new Promise(() => { });
}
main().catch(console.error);
