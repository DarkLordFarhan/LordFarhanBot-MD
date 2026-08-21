'use strict';

/*
 * LORD FARHAN MD — Native Pairing
 *
 * .pair 2547XXXXXXXX
 *
 * Creates a SEPARATE temporary Baileys socket.
 * The main bot socket is NOT used for pairing.
 *
 * Flow:
 * .pair number
 *      ↓
 * temporary socket
 *      ↓
 * WhatsApp pairing code
 *      ↓
 * user links phone
 *      ↓
 * temporary socket becomes open
 *      ↓
 * creds.json → gzip → base64
 *      ↓
 * LordBot~SESSION
 *      ↓
 * session sent privately to requester
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const pino = require('pino');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers,
    DisconnectReason
} = require('@whiskeysockets/baileys');

const activePairs = new Map();

function normaliseNumber(raw) {
    const number = String(raw || '').replace(/\D/g, '');

    if (number.length < 7 || number.length > 15) {
        return null;
    }

    return number;
}

function cleanup(dir) {
    try {
        fs.rmSync(dir, {
            recursive: true,
            force: true
        });
    } catch (_) {}
}

function makeSessionId(credsPath) {
    if (!fs.existsSync(credsPath)) {
        throw new Error('creds.json was not created');
    }

    const creds = fs.readFileSync(credsPath, 'utf8');

    // Validate creds before creating the session.
    JSON.parse(creds);

    const compressed = zlib.gzipSync(
        Buffer.from(creds, 'utf8')
    );

    return 'LordBot~' + compressed.toString('base64');
}

async function createPair(number, requesterJid, sendMessage, quoted) {

    if (activePairs.has(number)) {
        return sendMessage(
            requesterJid,
            {
                text:
                    `⏳ *Pairing already in progress*\n\n` +
                    `A pairing code for *${number}* is already active.\n\n` +
                    `Use the existing code instead of requesting another one.`
            },
            { quoted }
        );
    }

    const workDir = fs.mkdtempSync(
        path.join(
            os.tmpdir(),
            `lordfarhan-pair-${number}-`
        )
    );

    let closed = false;
    let timeout;

    const finish = () => {
        if (closed) return;

        closed = true;

        if (timeout) {
            clearTimeout(timeout);
        }

        activePairs.delete(number);

        setTimeout(() => {
            cleanup(workDir);
        }, 5000);
    };

    try {

        activePairs.set(number, true);

        await sendMessage(
            requesterJid,
            {
                text:
                    `📱 *LORD FARHAN NATIVE PAIRING*\n\n` +
                    `Number: *${number}*\n\n` +
                    `⏳ Starting secure pairing socket...`
            },
            { quoted }
        );

        const { version } =
            await fetchLatestBaileysVersion();

        const {
            state,
            saveCreds
        } = await useMultiFileAuthState(workDir);

        const pairSock = makeWASocket({

            version,

            logger: pino({
                level: 'silent'
            }),

            printQRInTerminal: false,

            browser:
                Browsers.ubuntu('Chrome'),

            auth: {
                creds: state.creds,

                keys:
                    makeCacheableSignalKeyStore(
                        state.keys,
                        pino({
                            level: 'fatal'
                        })
                    )
            },

            syncFullHistory: false,

            markOnlineOnConnect: false,

            connectTimeoutMs: 60000,

            defaultQueryTimeoutMs: 60000
        });

        /*
         * VERY IMPORTANT:
         * Save every credential update.
         */
        pairSock.ev.on(
            'creds.update',
            saveCreds
        );

        /*
         * Safety timeout.
         */
        timeout = setTimeout(
            async () => {

                if (closed) return;

                await sendMessage(
                    requesterJid,
                    {
                        text:
                            `⌛ *Pairing expired*\n\n` +
                            `No account was linked within 5 minutes.\n\n` +
                            `Run *.pair ${number}* again.`
                    },
                    { quoted }
                ).catch(() => {});

                try {
                    pairSock.end(
                        new Error('Pairing timeout')
                    );
                } catch (_) {}

                finish();

            },
            5 * 60 * 1000
        );

        /*
         * Connection events.
         */
        pairSock.ev.on(
            'connection.update',
            async update => {

                const {
                    connection,
                    lastDisconnect
                } = update;

                if (connection === 'open') {

                    try {

                        /*
                         * Give Baileys a moment to flush
                         * the final credential update.
                         */
                        await new Promise(
                            resolve =>
                                setTimeout(
                                    resolve,
                                    1500
                                )
                        );

                        await saveCreds();

                        const credsPath =
                            path.join(
                                workDir,
                                'creds.json'
                            );

                        const sessionId =
                            makeSessionId(
                                credsPath
                            );

                        /*
                         * NEVER send the session to a group.
                         * Send it privately to the person who
                         * requested the pairing.
                         */
                        await sendMessage(
                            requesterJid,
                            {
                                text:
                                    `✅ *PAIRING SUCCESSFUL!*\n\n` +
                                    `🌑 *LORD FARHAN MD*\n\n` +
                                    `📱 Number: *${number}*\n\n` +
                                    `🔐 *SESSION_ID*\n\n` +
                                    `\`\`\`${sessionId}\`\`\`\n\n` +
                                    `📌 Copy the COMPLETE session starting with:\n` +
                                    `*LordBot~*\n\n` +
                                    `⚠️ *KEEP THIS SESSION PRIVATE.*\n` +
                                    `Anyone with it may access the linked bot account.`
                            }
                        );

                        /*
                         * Give WhatsApp time to finish the
                         * final handshake before cleanup.
                         */
                        setTimeout(
                            () => {

                                try {
                                    pairSock.end();
                                } catch (_) {}

                                finish();

                            },
                            3000
                        );

                    } catch (error) {

                        console.error(
                            '[PAIR] Session creation error:',
                            error
                        );

                        await sendMessage(
                            requesterJid,
                            {
                                text:
                                    `❌ *PAIRING CONNECTED BUT SESSION CREATION FAILED*\n\n` +
                                    `${error.message}`
                            },
                            { quoted }
                        ).catch(() => {});

                        try {
                            pairSock.end();
                        } catch (_) {}

                        finish();
                    }
                }

                if (connection === 'close') {

                    if (closed) return;

                    const code =
                        lastDisconnect
                            ?.error
                            ?.output
                            ?.statusCode;

                    console.log(
                        `[PAIR] Connection closed: ${code}`
                    );

                    /*
                     * If it closes before opening,
                     * pairing failed.
                     */
                    await sendMessage(
                        requesterJid,
                        {
                            text:
                                `❌ *PAIRING FAILED*\n\n` +
                                `WhatsApp closed the temporary pairing connection.\n\n` +
                                `Try *.pair ${number}* again.`
                        },
                        { quoted }
                    ).catch(() => {});

                    finish();
                }
            }
        );

        /*
         * Wait until Baileys has started connecting.
         * Then request the phone pairing code.
         */
        await new Promise(
            resolve => {

                let done = false;

                const listener =
                    ({ connection, qr }) => {

                        if (
                            !done &&
                            (
                                connection === 'connecting' ||
                                qr
                            )
                        ) {

                            done = true;

                            pairSock.ev.off(
                                'connection.update',
                                listener
                            );

                            resolve();
                        }
                    };

                pairSock.ev.on(
                    'connection.update',
                    listener
                );

                /*
                 * Fallback for Baileys versions
                 * that don't emit connecting quickly.
                 */
                setTimeout(() => {

                    if (!done) {

                        done = true;

                        pairSock.ev.off(
                            'connection.update',
                            listener
                        );

                        resolve();
                    }

                }, 5000);
            }
        );

        const code =
            await pairSock.requestPairingCode(
                number
            );

        const cleanCode =
            String(code)
                .replace(
                    /[^A-Za-z0-9]/g,
                    ''
                )
                .toUpperCase();

        const displayCode =
            cleanCode.length === 8
                ? cleanCode.slice(0, 4) +
                  '-' +
                  cleanCode.slice(4)
                : cleanCode;

        await sendMessage(
            requesterJid,
            {
                text:
                    `🔐 *WHATSAPP PAIRING CODE*\n\n` +
                    `*${displayCode}*\n\n` +
                    `📱 On the phone you want to connect:\n\n` +
                    `1️⃣ Open WhatsApp\n` +
                    `2️⃣ Settings\n` +
                    `3️⃣ Linked devices\n` +
                    `4️⃣ Link a device\n` +
                    `5️⃣ Link with phone number instead\n` +
                    `6️⃣ Enter the code above\n\n` +
                    `⏳ Waiting for the account to link...\n\n` +
                    `Once WhatsApp connects, I will automatically send your *LordBot~* SESSION_ID here.`
            },
            { quoted }
        );

    } catch (error) {

        console.error(
            '[PAIR] Error:',
            error?.stack || error
        );

        await sendMessage(
            requesterJid,
            {
                text:
                    `❌ *PAIRING ERROR*\n\n` +
                    `${error?.message || error}\n\n` +
                    `Try again with:\n` +
                    `.pair ${number || '2547XXXXXXXX'}`
            },
            { quoted }
        ).catch(() => {});

        cleanup(workDir);
        activePairs.delete(number);
    }
}

async function pairCommand(
    sock,
    chatId,
    message,
    q
) {

    try {

        if (!q || !q.trim()) {

            return sock.sendMessage(
                chatId,
                {
                    text:
                        `📱 *LORD FARHAN NATIVE PAIRING*\n\n` +
                        `Usage:\n` +
                        `.pair 2547XXXXXXXX\n\n` +
                        `Example:\n` +
                        `.pair 254712345678\n\n` +
                        `The pairing happens directly through WhatsApp.\n` +
                        `No Railway /pair page is required.`
                },
                { quoted: message }
            );
        }

        const number =
            normaliseNumber(q.trim());

        if (!number) {

            return sock.sendMessage(
                chatId,
                {
                    text:
                        `❌ *Invalid phone number*\n\n` +
                        `Use country code + number.\n\n` +
                        `Example:\n` +
                        `.pair 254712345678\n\n` +
                        `Do not use +, spaces or dashes.`
                },
                { quoted: message }
            );
        }

        /*
         * If command was sent in a group, send the
         * pairing/session privately to the requester.
         */
        const requesterJid =
            message?.key?.participant ||
            chatId;

        await createPair(
            number,
            requesterJid,
            (jid, content, options) =>
                sock.sendMessage(
                    jid,
                    content,
                    options
                ),
            message
        );

    } catch (error) {

        console.error(
            '[pair] command error:',
            error
        );

        await sock.sendMessage(
            chatId,
            {
                text:
                    `❌ Pair command failed.\n\n` +
                    `${error?.message || error}`
            },
            { quoted: message }
        ).catch(() => {});
    }
}

module.exports = pairCommand;
