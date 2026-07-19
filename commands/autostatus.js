const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

const channelInfo = {
    contextInfo: { forwardingScore: 1, isForwarded: true }
};

const configPath = path.join(__dirname, '../data/autoStatus.json');

// ── In-memory config cache ─────────────────────────────────────────────────────
// Reading from disk on every status update (which can be hundreds per hour) is a
// major source of lag. Cache it here; only touch disk when the config changes.
let _config = { enabled: false, reactOn: false };
try { _config = JSON.parse(fs.readFileSync(configPath, 'utf-8')); } catch (_) {}

function getConfig() { return _config; }
function saveConfig(cfg) {
    _config = cfg;
    // Write async so we never block the event loop
    fs.writeFile(configPath, JSON.stringify(cfg), () => {});
}

// Ensure the data dir + file exist
const dataDir = path.dirname(configPath);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(configPath)) saveConfig(_config);

// ── Rate limiter ───────────────────────────────────────────────────────────────
// Allow at most one status read every 1.5 s to avoid WhatsApp rate-limiting.
// This replaces the old `await delay(1000)` that blocked the event loop.
let _lastProcessed = 0;
function _isRateLimited() {
    const now = Date.now();
    if (now - _lastProcessed < 1500) return true;
    _lastProcessed = now;
    return false;
}

// ── .autostatus command ────────────────────────────────────────────────────────
async function autoStatusCommand(sock, chatId, msg, args) {
    try {
        const senderId = msg.key.participant || msg.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

        if (!msg.key.fromMe && !isOwner) {
            await sock.sendMessage(chatId, { text: '❌ This command can only be used by the owner!', ...channelInfo });
            return;
        }

        const config = getConfig();

        if (!args || args.length === 0) {
            await sock.sendMessage(chatId, {
                text:
                    '🔄 *Auto Status Settings*\n\n' +
                    `📱 *Auto View:* ${config.enabled ? '✅ On' : '❌ Off'}\n` +
                    `💫 *Reactions:* ${config.reactOn ? '✅ On' : '❌ Off'}\n\n` +
                    '*Commands:*\n' +
                    '.autostatus on/off\n' +
                    '.autostatus react on/off',
                ...channelInfo
            });
            return;
        }

        const cmd = args[0].toLowerCase();

        if (cmd === 'on') {
            saveConfig({ ...config, enabled: true });
            await sock.sendMessage(chatId, { text: '✅ Auto status view *enabled*.', ...channelInfo });
        } else if (cmd === 'off') {
            saveConfig({ ...config, enabled: false });
            await sock.sendMessage(chatId, { text: '❌ Auto status view *disabled*.', ...channelInfo });
        } else if (cmd === 'react') {
            const sub = (args[1] || '').toLowerCase();
            if (sub === 'on') {
                saveConfig({ ...config, reactOn: true });
                await sock.sendMessage(chatId, { text: '💫 Status reactions *enabled*.', ...channelInfo });
            } else if (sub === 'off') {
                saveConfig({ ...config, reactOn: false });
                await sock.sendMessage(chatId, { text: '❌ Status reactions *disabled*.', ...channelInfo });
            } else {
                await sock.sendMessage(chatId, { text: '❌ Use: .autostatus react on/off', ...channelInfo });
            }
        } else {
            await sock.sendMessage(chatId, { text: '❌ Use: .autostatus on/off / react on/off', ...channelInfo });
        }
    } catch (error) {
        console.error('[autostatus] command error:', error);
        await sock.sendMessage(chatId, { text: '❌ Error: ' + error.message, ...channelInfo });
    }
}

// ── React to status ────────────────────────────────────────────────────────────
async function reactToStatus(sock, statusKey) {
    if (!getConfig().reactOn) return;
    try {
        await sock.relayMessage(
            'status@broadcast',
            {
                reactionMessage: {
                    key: {
                        remoteJid: 'status@broadcast',
                        id: statusKey.id,
                        participant: statusKey.participant || statusKey.remoteJid,
                        fromMe: false
                    },
                    text: '💚'
                }
            },
            {
                messageId: statusKey.id,
                statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid]
            }
        );
    } catch (e) {
        // Silence non-critical reaction errors
    }
}

// ── Internal processor (fire-and-forget target) ────────────────────────────────
async function _processStatusKey(sock, key) {
    if (_isRateLimited()) return;
    try {
        await sock.readMessages([key]);
        await reactToStatus(sock, key);
    } catch (err) {
        if (err.message?.includes('rate-overlimit')) {
            // Back off silently — the rate limiter will handle the next one
        }
        // All other errors are silent; status viewing is non-critical
    }
}

// ── handleStatusUpdate — exported, called on every status event ────────────────
// IMPORTANT: this must never block or await heavily. Fire-and-forget keeps the
// bot's main message loop fast even when many statuses arrive simultaneously.
function handleStatusUpdate(sock, status) {
    if (!getConfig().enabled) return; // in-memory check — zero disk I/O

    // Pick the relevant key and fire-and-forget
    const fire = (key) => setImmediate(() => _processStatusKey(sock, key).catch(() => {}));

    if (status.messages?.length > 0) {
        const msg = status.messages[0];
        if (msg.key?.remoteJid === 'status@broadcast') fire(msg.key);
        return;
    }
    if (status.key?.remoteJid === 'status@broadcast') { fire(status.key); return; }
    if (status.reaction?.key?.remoteJid === 'status@broadcast') { fire(status.reaction.key); return; }
}

module.exports = { autoStatusCommand, handleStatusUpdate };
