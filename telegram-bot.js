'use strict';

/**
 * LordFarhan Bot — Telegram Pairing Bot
 *
 * People DM this Telegram bot their WhatsApp number,
 * get an 8-digit pairing code, enter it in WhatsApp,
 * and their bot starts automatically — no SESSION_ID needed.
 */

if (!process.env.TELEGRAM_TOKEN) {
    console.log('[telegram] No TELEGRAM_TOKEN set — Telegram bot disabled.');
    module.exports = null;
    return;
}

const { Telegraf } = require('telegraf');
const fs   = require('fs');
const path = require('path');
const pino = require('pino');
const os   = require('os');
const NodeCache = require('node-cache');
const PhoneNumber = require('awesome-phonenumber');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers,
    DisconnectReason,
    jidDecode,
    jidNormalizedUser,
    delay,
} = require('@whiskeysockets/baileys');

const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const store    = require('./lib/lightweight_store');
const settings = require('./settings');
const { smsg } = require('./lib/myfunc');

const SESSIONS_DIR = path.join(__dirname, 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

// ─── Cached Baileys version ───────────────────────────────────────────────────
let cachedVersion = null;
(async () => {
    try {
        const { version } = await fetchLatestBaileysVersion();
        cachedVersion = version;
    } catch (_) {}
})();

// ─── Telegram bot ─────────────────────────────────────────────────────────────
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// userState : Map<telegramChatId, { step: 'idle'|'waiting_number'|'pairing', number? }>
const userState = new Map();
// Track active pairing promises so we don't double-pair
const pairingInProgress = new Set();

// ─── /start ───────────────────────────────────────────────────────────────────
bot.start(async ctx => {
    userState.set(ctx.chat.id, { step: 'waiting_number' });
    await ctx.reply(
        `🕷️ *Welcome to LordFarhan Bot Pairing!*\n\n` +
        `This bot links your WhatsApp number to *LordFarhan Bot*.\n\n` +
        `📲 Send me your WhatsApp number with country code.\n` +
        `Example: \`254712345678\`\n\n` +
        `_No + sign needed — just digits._`,
        { parse_mode: 'Markdown' }
    );
});

// ─── /help ────────────────────────────────────────────────────────────────────
bot.help(async ctx => {
    await ctx.reply(
        `🕷️ *LordFarhan Bot Pairing Help*\n\n` +
        `1️⃣ Send /start\n` +
        `2️⃣ Enter your WhatsApp number (with country code)\n` +
        `3️⃣ Copy the 8-digit code I send you\n` +
        `4️⃣ Open WhatsApp → Settings → Linked Devices → Link a Device → Link with phone number\n` +
        `5️⃣ Enter the code — your bot starts automatically ✅\n\n` +
        `Having issues? Send /start to try again.`,
        { parse_mode: 'Markdown' }
    );
});

// ─── Message handler ──────────────────────────────────────────────────────────
bot.on('text', async ctx => {
    const chatId  = ctx.chat.id;
    const text    = ctx.message.text.trim();
    const state   = userState.get(chatId) || { step: 'idle' };

    // If user sends a command while we're waiting, reset
    if (text.startsWith('/')) return;

    if (state.step === 'waiting_number') {
        const number = text.replace(/\D/g, '');

        if (!number || number.length < 10 || number.length > 15) {
            return ctx.reply(
                '❌ Invalid number. Please send your full number with country code.\nExample: `254712345678`',
                { parse_mode: 'Markdown' }
            );
        }

        if (pairingInProgress.has(number)) {
            return ctx.reply('⏳ Already generating a code for this number. Please wait...');
        }

        userState.set(chatId, { step: 'pairing', number });
        pairingInProgress.add(number);

        const statusMsg = await ctx.reply('⏳ Generating your pairing code...');

        try {
            const code = await generatePairingCode(number, chatId, statusMsg.message_id);
            await ctx.telegram.editMessageText(
                chatId, statusMsg.message_id, undefined,
                `✅ *Your Pairing Code:*\n\n` +
                `\`${code}\`\n\n` +
                `📱 *How to use:*\n` +
                `1. Open WhatsApp\n` +
                `2. Go to *Settings → Linked Devices → Link a Device*\n` +
                `3. Tap *"Link with phone number"*\n` +
                `4. Enter the code above\n\n` +
                `⏰ Code expires in ~60 seconds.\n` +
                `_Your bot will start automatically once linked!_`,
                { parse_mode: 'Markdown' }
            );
        } catch (err) {
            pairingInProgress.delete(number);
            userState.set(chatId, { step: 'waiting_number' });
            await ctx.telegram.editMessageText(
                chatId, statusMsg.message_id, undefined,
                `❌ Failed to generate code: ${err.message}\n\nSend your number again to retry.`
            );
        }
    } else {
        // Idle — prompt them to start
        userState.set(chatId, { step: 'waiting_number' });
        await ctx.reply(
            '👋 Send me your WhatsApp number with country code to get started.\nExample: `254712345678`',
            { parse_mode: 'Markdown' }
        );
    }
});

// ─── Pairing + auto-start logic ───────────────────────────────────────────────
async function generatePairingCode(number, telegramChatId, statusMsgId) {
    const version = cachedVersion || (await fetchLatestBaileysVersion()).version;

    // Temp dir for pairing handshake
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `tgpair-${number}-`));
    const { state, saveCreds } = await useMultiFileAuthState(tmpDir);

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'),
        auth: {
            creds: state.creds,
            keys:  makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        syncFullHistory: false,
        defaultQueryTimeoutMs: 30_000,
        connectTimeoutMs:      30_000,
    });

    sock.ev.on('creds.update', saveCreds);

    // Safety kill after 5 min
    const killTimer = setTimeout(() => {
        try { sock.end(undefined); } catch (_) {}
        cleanup(tmpDir);
        pairingInProgress.delete(number);
    }, 5 * 60 * 1000);

    sock.ev.on('connection.update', async ({ connection }) => {
        if (connection === 'open') {
            clearTimeout(killTimer);
            pairingInProgress.delete(number);

            // Persist credentials to permanent session dir
            const sessionDir = path.join(SESSIONS_DIR, number);
            if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

            try {
                await saveCreds();
                // Copy all auth files from tmp → permanent session dir
                const files = fs.readdirSync(tmpDir);
                for (const f of files) {
                    fs.copyFileSync(path.join(tmpDir, f), path.join(sessionDir, f));
                }
            } catch (e) {
                console.error('[telegram] Failed to save session:', e.message);
            }

            cleanup(tmpDir);

            // Notify Telegram user
            try {
                await bot.telegram.sendMessage(
                    telegramChatId,
                    `🎉 *Linked successfully!*\n\n` +
                    `✅ Your WhatsApp bot is now starting up...\n` +
                    `🕷️ *LordFarhan Bot* will be ready in a few seconds.\n\n` +
                    `_Send .help in any WhatsApp chat to see all commands._`,
                    { parse_mode: 'Markdown' }
                );
            } catch (_) {}

            // Start the full WhatsApp bot for this user
            startUserBot(number, sessionDir, telegramChatId);
        }

        if (connection === 'close') {
            clearTimeout(killTimer);
            cleanup(tmpDir);
            pairingInProgress.delete(number);
        }
    });

    const code = await sock.requestPairingCode(number);
    return typeof code === 'string' ? code.trim() : String(code).trim();
}

// ─── Full WhatsApp bot instance for a paired user ─────────────────────────────
async function startUserBot(number, sessionDir, telegramChatId) {
    try {
        const version = cachedVersion || (await fetchLatestBaileysVersion()).version;
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const msgRetryCounterCache = new NodeCache();

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: ['Ubuntu', 'Chrome', '20.0.04'],
            auth: {
                creds: state.creds,
                keys:  makeCacheableSignalKeyStore(
                    state.keys,
                    pino({ level: 'fatal' }).child({ level: 'fatal' })
                ),
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            getMessage: async (key) => {
                let jid = jidNormalizedUser(key.remoteJid);
                let msg = await store.loadMessage(jid, key.id);
                return msg?.message || '';
            },
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs:      60000,
            keepAliveIntervalMs:   10000,
        });

        sock.ev.on('creds.update', saveCreds);
        store.bind(sock.ev);

        sock.public = true;
        sock.serializeM = (m) => smsg(sock, m, store);

        sock.decodeJid = (jid) => {
            if (!jid) return jid;
            if (/:d+@/gi.test(jid)) {
                const decode = jidDecode(jid) || {};
                return decode.user && decode.server ? decode.user + '@' + decode.server : jid;
            }
            return jid;
        };

        sock.getName = (jid, withoutContact = false) => {
            const id = sock.decodeJid(jid);
            if (id.endsWith('@g.us')) return new Promise(async (resolve) => {
                let v = store.contacts[id] || {};
                if (!(v.name || v.subject)) v = await sock.groupMetadata(id).catch(() => ({}));
                resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'));
            });
            const v = store.contacts[id] || {};
            return v.name || v.subject || v.verifiedName ||
                PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
        };

        // Handle incoming messages
        sock.ev.on('messages.upsert', async chatUpdate => {
            try {
                const mek = chatUpdate.messages[0];
                if (!mek.message) return;
                mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage')
                    ? mek.message.ephemeralMessage.message : mek.message;
                if (mek.key?.remoteJid === 'status@broadcast') {
                    await handleStatus(sock, chatUpdate); return;
                }
                if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;
                if (sock?.msgRetryCounterCache) sock.msgRetryCounterCache.clear();
                await handleMessages(sock, chatUpdate, true);
            } catch (err) {
                console.error(`[telegram-bot/${number}] handleMessages error:`, err.message);
            }
        });

        sock.ev.on('group-participants.update', async (update) => {
            await handleGroupParticipantUpdate(sock, update);
        });

        sock.ev.on('status.update',      async (s) => handleStatus(sock, s));
        sock.ev.on('messages.reaction',  async (s) => handleStatus(sock, s));

        sock.ev.on('contacts.update', update => {
            for (const contact of update) {
                const id = sock.decodeJid(contact.id);
                if (store?.contacts) store.contacts[id] = { id, name: contact.notify };
            }
        });

        // ─── Anti-call ──────────────────────────────────────────────────────
        const antiCallNotified = new Set();
        sock.ev.on('call', async (calls) => {
            try {
                const { readState } = require('./commands/anticall');
                const s = readState();
                if (!s.enabled) return;
                for (const call of calls) {
                    const callerJid = call.from || call.peerJid || call.chatId;
                    if (!callerJid) continue;
                    try {
                        if (typeof sock.rejectCall === 'function' && call.id)
                            await sock.rejectCall(call.id, callerJid);
                    } catch (_) {}
                    if (!antiCallNotified.has(callerJid)) {
                        antiCallNotified.add(callerJid);
                        setTimeout(() => antiCallNotified.delete(callerJid), 60000);
                        await sock.sendMessage(callerJid, { text: 'Anticall enabled. Call rejected.' });
                    }
                    setTimeout(async () => {
                        try { await sock.updateBlockStatus(callerJid, 'block'); } catch (_) {}
                    }, 800);
                }
            } catch (_) {}
        });

        // ─── Connection events ───────────────────────────────────────────────
        sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
            if (connection === 'open') {
                console.log(`[telegram-bot] ✅ ${number} connected`);
                const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                try {
                    const imagePath = path.join(__dirname, 'assets', 'bot_image.jpg');
                    const caption = `🕷️ *LordFarhan Bot Connected!*\n\n` +
                        `✅ Your bot is now live.\n` +
                        `📌 Send *.help* to see all commands.`;
                    if (fs.existsSync(imagePath)) {
                        await sock.sendMessage(botJid, {
                            image: fs.readFileSync(imagePath),
                            caption,
                        });
                    } else {
                        await sock.sendMessage(botJid, { text: caption });
                    }
                } catch (_) {}

                // Also confirm on Telegram
                try {
                    await bot.telegram.sendMessage(
                        telegramChatId,
                        `✅ *Bot is live!*\nSend *.help* in WhatsApp to see all commands.\n\nTo pair another number, send /start`,
                        { parse_mode: 'Markdown' }
                    );
                } catch (_) {}
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const loggedOut  = statusCode === DisconnectReason.loggedOut || statusCode === 401;

                if (loggedOut) {
                    console.log(`[telegram-bot] ❌ ${number} logged out — removing session`);
                    try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch (_) {}
                    try {
                        await bot.telegram.sendMessage(
                            telegramChatId,
                            `⚠️ Your WhatsApp session was logged out.\nSend /start to pair again.`
                        );
                    } catch (_) {}
                } else {
                    console.log(`[telegram-bot] 🔄 ${number} disconnected — reconnecting in 5s`);
                    await delay(5000);
                    startUserBot(number, sessionDir, telegramChatId);
                }
            }
        });

        return sock;
    } catch (err) {
        console.error(`[telegram-bot] startUserBot(${number}) error:`, err.message);
        await delay(5000);
        startUserBot(number, sessionDir, telegramChatId);
    }
}

// ─── Auto-resume sessions on startup ─────────────────────────────────────────
// Any number that was previously paired will reconnect automatically when
// the bot restarts — no manual action needed.
async function resumeExistingSessions() {
    if (!fs.existsSync(SESSIONS_DIR)) return;
    const numbers = fs.readdirSync(SESSIONS_DIR).filter(n => {
        const credsPath = path.join(SESSIONS_DIR, n, 'creds.json');
        return fs.existsSync(credsPath);
    });
    if (numbers.length === 0) return;
    console.log(`[telegram-bot] Resuming ${numbers.length} existing session(s)...`);
    for (const number of numbers) {
        const sessionDir = path.join(SESSIONS_DIR, number);
        // telegramChatId is unknown on resume — pass null (bot won't DM Telegram on reconnect)
        startUserBot(number, sessionDir, null).catch(console.error);
        await delay(2000); // stagger startups to avoid rate-limits
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cleanup(dir) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

// ─── Launch ───────────────────────────────────────────────────────────────────
bot.launch({
    dropPendingUpdates: true,
}).then(() => {
    console.log('[telegram] ✅ Telegram pairing bot is running');
}).catch(err => {
    console.error('[telegram] Failed to launch:', err.message);
});

resumeExistingSessions().catch(console.error);

// Graceful stop
process.once('SIGINT',  () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;
