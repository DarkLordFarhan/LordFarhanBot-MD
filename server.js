/**
 * LordFarhan Bot — Web pair/QR server
 *
 * Bug fixes vs the previous Railway version:
 *  1. CODE SPAM FIX  — codes are cached 55 s per number. Repeat clicks return
 *     the same code; no extra socket is created, no extra "Enter new code" hits
 *     the user's WhatsApp.
 *  2. PENDING LOCK   — if generation is already running for a number, a second
 *     request waits for the same promise rather than spawning a duplicate socket.
 *  3. STARTUP CACHE  — fetchLatestBaileysVersion() runs once at startup, not on
 *     every request (saves ~300–600 ms per call).
 *  4. PROPER CLEANUP — temp auth dirs are removed after pairing succeeds or after
 *     a 5-minute timeout so the server doesn't leak disk space.
 */

'use strict';

const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const os       = require('os');
const zlib     = require('zlib');
const pino     = require('pino');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers,
    DisconnectReason,
} = require('@whiskeysockets/baileys');

// ─── App ────────────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// ─── Startup: cache Baileys version once ─────────────────────────────────────
let cachedVersion = null;
(async () => {
    try {
        const { version } = await fetchLatestBaileysVersion();
        cachedVersion = version;
        console.log('[server] Baileys version cached:', version.join('.'));
    } catch (e) {
        console.error('[server] Could not fetch Baileys version at startup:', e.message);
    }
})();

// ─── Per-number state ─────────────────────────────────────────────────────────
// codeCache : Map<number, { code: string, expiresAt: number }>
// pending   : Map<number, Promise<string>>
const codeCache = new Map();
const pending   = new Map();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cleanNumber(raw) {
    return (raw || '').replace(/\D/g, '');
}

function cleanup(dir) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

/**
 * Create a fresh Baileys socket in a temp dir, call requestPairingCode(),
 * then keep the socket alive so that — if the user actually enters the code —
 * we can DM them their SESSION_ID automatically.
 */
async function generateCode(number) {
    const version = cachedVersion || (await fetchLatestBaileysVersion()).version;

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `lfpair-${number}-`));
    const { state, saveCreds } = await useMultiFileAuthState(tmpDir);

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'),
        auth: {
            creds:  state.creds,
            keys:   makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        // No syncFullHistory — keeps the socket lightweight
        syncFullHistory: false,
        defaultQueryTimeoutMs: 30_000,
        connectTimeoutMs:      30_000,
    });

    sock.ev.on('creds.update', saveCreds);

    // Safety: kill the socket and clean up after 5 minutes regardless
    const killTimer = setTimeout(() => {
        try { sock.end(undefined); } catch (_) {}
        cleanup(tmpDir);
    }, 5 * 60 * 1000);

    sock.ev.on('connection.update', async ({ connection }) => {
        if (connection === 'open') {
            clearTimeout(killTimer);
            // Pairing succeeded — build SESSION_ID and DM it to the user
            try {
                await saveCreds();
                const credsPath = path.join(tmpDir, 'creds.json');
                if (fs.existsSync(credsPath)) {
                    const raw        = fs.readFileSync(credsPath, 'utf-8');
                    const compressed = zlib.gzipSync(Buffer.from(raw, 'utf-8'));
                    const sessionId  = 'LordBot~' + compressed.toString('base64');

                    const jid = number + '@s.whatsapp.net';
                    await sock.sendMessage(jid, {
                        text:
                            '✅ *LordFarhan Bot — Pairing Successful!*\n\n' +
                            'Your SESSION_ID is below. Copy the full string and paste it into your Railway (or panel) environment variable named *SESSION_ID*, then restart the bot.\n\n' +
                            '```' + sessionId + '```\n\n' +
                            '⚠️ _Keep this private — it gives full access to your bot session._',
                    });
                }
            } catch (e) {
                console.error('[server] Failed to send SESSION_ID DM:', e.message);
            }
            // Give the send a moment, then close
            setTimeout(() => {
                try { sock.end(undefined); } catch (_) {}
                cleanup(tmpDir);
            }, 3000);
        }

        if (connection === 'close') {
            clearTimeout(killTimer);
            cleanup(tmpDir);
        }
    });

    // requestPairingCode resolves with the 8-char code string
    const code = await sock.requestPairingCode(number);
    return typeof code === 'string' ? code.trim() : String(code).trim();
}

// ─── /code endpoint ───────────────────────────────────────────────────────────
app.get('/code', async (req, res) => {
    const number = cleanNumber(req.query.number);

    if (!number || number.length < 10 || number.length > 15) {
        return res.status(400).json({ error: 'Provide a valid phone number with country code (digits only).' });
    }

    // 1. Return cached code if still valid — zero extra sockets, zero extra WA notifications
    const cached = codeCache.get(number);
    if (cached && Date.now() < cached.expiresAt) {
        return res.json({ code: cached.code });
    }
    codeCache.delete(number);

    // 2. If already generating for this number, wait for the same promise
    if (pending.has(number)) {
        try {
            const code = await pending.get(number);
            return res.json({ code });
        } catch (err) {
            return res.status(500).json({ error: err.message || 'Failed to generate code' });
        }
    }

    // 3. Start generation — store the promise so concurrent requests share it
    const promise = generateCode(number)
        .then(code => {
            // Cache for 55 s (WA code valid ~60 s; give 5 s margin)
            codeCache.set(number, { code, expiresAt: Date.now() + 55_000 });
            pending.delete(number);
            return code;
        })
        .catch(err => {
            pending.delete(number);
            throw err;
        });

    pending.set(number, promise);

    try {
        const code = await promise;
        return res.json({ code });
    } catch (err) {
        console.error('[server] /code error for', number, ':', err.message);
        return res.status(500).json({ error: err.message || 'Failed to generate pairing code. Try again.' });
    }
});

// ─── HTML routes (fallback for clean URLs) ────────────────────────────────────
app.get('/pair', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'pair.html')));
app.get('/qr',   (_req, res) => res.sendFile(path.join(__dirname, 'public', 'qr.html')));
app.get('/',     (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`[server] Web server running on port ${PORT}`));

module.exports = app;
