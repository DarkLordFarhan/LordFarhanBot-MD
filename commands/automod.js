'use strict';
/**
 * Auto-moderation commands (per-group toggles):
 * antisticker, antiimage, antivideo, antiaudio, antimention,
 * antistatusmention, antigrouplink, antidemote, antipromote,
 * antigroupcall, antispam
 */

const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');

const dataFile = path.join(__dirname, '..', 'data', 'automod.json');

function load() {
    try { return JSON.parse(fs.readFileSync(dataFile)); } catch { return {}; }
}
function save(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function getText(m) {
    return (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim().toLowerCase();
}

// Generic toggle handler
async function toggleAutomod(sock, chatId, senderId, message, key, label) {
    if (!chatId.endsWith('@g.us'))
        return sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: message });
    const admin = await isAdmin(sock, chatId, senderId);
    if (!admin)
        return sock.sendMessage(chatId, { text: '❌ Admins only.' }, { quoted: message });

    const text = getText(message);
    const on = text.includes('on') || text.includes('enable');
    const off = text.includes('off') || text.includes('disable');

    const data = load();
    if (!on && !off) {
        const cur = data[chatId]?.[key] ? '🟢 ON' : '🔴 OFF';
        return sock.sendMessage(chatId, { text: `${label} is currently: ${cur}\nUse .${key} on/off` }, { quoted: message });
    }
    data[chatId] = data[chatId] || {};
    data[chatId][key] = on;
    save(data);
    await sock.sendMessage(chatId, { text: `✅ ${label} ${on ? 'enabled' : 'disabled'}.` }, { quoted: message });
}

async function antiStickerCommand(sock, chatId, senderId, message) {
    await toggleAutomod(sock, chatId, senderId, message, 'antisticker', '🚫 Anti-Sticker');
}
async function antiImageCommand(sock, chatId, senderId, message) {
    await toggleAutomod(sock, chatId, senderId, message, 'antiimage', '🚫 Anti-Image');
}
async function antiVideoCommand(sock, chatId, senderId, message) {
    await toggleAutomod(sock, chatId, senderId, message, 'antivideo', '🚫 Anti-Video');
}
async function antiAudioCommand(sock, chatId, senderId, message) {
    await toggleAutomod(sock, chatId, senderId, message, 'antiaudio', '🚫 Anti-Audio');
}
async function antiMentionCommand(sock, chatId, senderId, message) {
    await toggleAutomod(sock, chatId, senderId, message, 'antimention', '🚫 Anti-Mention');
}
async function antiStatusMentionCommand(sock, chatId, senderId, message) {
    await toggleAutomod(sock, chatId, senderId, message, 'antistatusmention', '🚫 Anti-Status-Mention');
}
async function antiGroupLinkCommand(sock, chatId, senderId, message) {
    await toggleAutomod(sock, chatId, senderId, message, 'antigrouplink', '🚫 Anti-GroupLink');
}
async function antiDemoteCommand(sock, chatId, senderId, message) {
    await toggleAutomod(sock, chatId, senderId, message, 'antidemote', '🚫 Anti-Demote');
}
async function antiPromoteCommand(sock, chatId, senderId, message) {
    await toggleAutomod(sock, chatId, senderId, message, 'antipromote', '🚫 Anti-Promote');
}
async function antiGroupCallCommand(sock, chatId, senderId, message) {
    await toggleAutomod(sock, chatId, senderId, message, 'antigroupcall', '🚫 Anti-GroupCall');
}

// antispam: track message frequency
const spamTracker = new Map(); // jid => { count, timer }
async function antiSpamCommand(sock, chatId, senderId, message) {
    await toggleAutomod(sock, chatId, senderId, message, 'antispam', '🚫 Anti-Spam');
}

/**
 * Call this from the main message handler to enforce automod rules.
 * Returns true if the message was deleted/actioned.
 */
async function enforceAutomod(sock, chatId, senderId, message) {
    if (!chatId.endsWith('@g.us')) return false;
    const data = load();
    const cfg = data[chatId] || {};

    const msgType = Object.keys(message.message || {})[0] || '';

    // antisticker
    if (cfg.antisticker && msgType === 'stickerMessage') {
        try { await sock.sendMessage(chatId, { delete: message.key }); } catch {}
        return true;
    }
    // antiimage
    if (cfg.antiimage && (msgType === 'imageMessage' || msgType === 'viewOnceMessageV2')) {
        try { await sock.sendMessage(chatId, { delete: message.key }); } catch {}
        return true;
    }
    // antivideo
    if (cfg.antivideo && msgType === 'videoMessage') {
        try { await sock.sendMessage(chatId, { delete: message.key }); } catch {}
        return true;
    }
    // antiaudio
    if (cfg.antiaudio && (msgType === 'audioMessage' || msgType === 'pttMessage')) {
        try { await sock.sendMessage(chatId, { delete: message.key }); } catch {}
        return true;
    }
    // antimention
    if (cfg.antimention) {
        const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentioned.length > 0) {
            try { await sock.sendMessage(chatId, { delete: message.key }); } catch {}
            return true;
        }
    }
    // antigrouplink
    if (cfg.antigrouplink) {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        if (/chat\.whatsapp\.com\//.test(text)) {
            try { await sock.sendMessage(chatId, { delete: message.key }); } catch {}
            await sock.sendMessage(chatId, {
                text: `⚠️ @${senderId.split('@')[0]} Group links are not allowed here!`,
                mentions: [senderId]
            });
            return true;
        }
    }
    // antispam
    if (cfg.antispam) {
        const key = `${chatId}:${senderId}`;
        const now = Date.now();
        const entry = spamTracker.get(key) || { count: 0, first: now };
        entry.count++;
        spamTracker.set(key, entry);
        setTimeout(() => spamTracker.delete(key), 5000);
        if (entry.count > 8) {
            try { await sock.groupParticipantsUpdate(chatId, [senderId], 'remove'); } catch {}
            await sock.sendMessage(chatId, {
                text: `🚫 @${senderId.split('@')[0]} removed for spamming.`,
                mentions: [senderId]
            });
            return true;
        }
    }
    return false;
}

module.exports = {
    antiStickerCommand, antiImageCommand, antiVideoCommand, antiAudioCommand,
    antiMentionCommand, antiStatusMentionCommand, antiGroupLinkCommand,
    antiDemoteCommand, antiPromoteCommand, antiGroupCallCommand, antiSpamCommand,
    enforceAutomod,
};
