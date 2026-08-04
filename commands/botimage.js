'use strict';
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'botsettings.json');

function readSettings() { try { return JSON.parse(fs.readFileSync(SETTINGS_FILE)); } catch (_) { return {}; } }
function writeSettings(d) { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(SETTINGS_FILE, JSON.stringify(d, null, 2)); }

/**
 * .setbotpic  – anyone can set the bot profile picture
 * .botpictoggle – owner/sudo only: enable/disable the open setbotpic feature
 */
async function botimageCommand(sock, chatId, message, cmd, senderId) {
    const isOwnerOrSudo = require('../lib/isOwner');
    const settings = readSettings();

    // ── Toggle (owner/sudo only) ─────────────────────────────────────────────
    if (cmd === '.botpictoggle') {
        const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);
        if (!message.key.fromMe && !senderIsOwnerOrSudo) {
            return sock.sendMessage(chatId, { text: '❌ Only owner/sudo can toggle this.' }, { quoted: message });
        }
        settings.openBotPic = !settings.openBotPic;
        writeSettings(settings);
        return sock.sendMessage(chatId, {
            text: `🖼️ *Bot picture* is now open to *${settings.openBotPic ? '🟢 everyone' : '🔴 owner only'}*`
        }, { quoted: message });
    }

    // ── setbotpic ────────────────────────────────────────────────────────────
    if (cmd === '.setbotpic') {
        // If openBotPic is OFF, only owner/sudo can use it
        if (!settings.openBotPic) {
            const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);
            if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                return sock.sendMessage(chatId, {
                    text: '❌ Bot picture changes are currently restricted to owner/sudo.\nAsk the owner to enable *.botpictoggle*.'
                }, { quoted: message });
            }
        }

        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const directImage = message.message?.imageMessage;

        const imageMessage = directImage || quotedMessage?.imageMessage || quotedMessage?.stickerMessage;
        if (!imageMessage) {
            return sock.sendMessage(chatId, {
                text: '🖼️ *Set Bot Picture*\n\nReply to an image with *.setbotpic* to update the bot\'s profile picture.\n\n_Anyone can use this command!_'
            }, { quoted: message });
        }

        try {
            const tmpDir = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

            const msgType = directImage ? 'image' : (quotedMessage?.stickerMessage ? 'sticker' : 'image');
            const stream = await downloadContentFromMessage(imageMessage, msgType === 'sticker' ? 'sticker' : 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            const imagePath = path.join(tmpDir, `botpic_${Date.now()}.jpg`);
            fs.writeFileSync(imagePath, buffer);

            await sock.updateProfilePicture(sock.user.id, { url: imagePath });
            try { fs.unlinkSync(imagePath); } catch (_) {}

            return sock.sendMessage(chatId, {
                text: `✅ Bot profile picture updated by @${senderId.split('@')[0]}! 🖼️`,
                mentions: [senderId]
            }, { quoted: message });
        } catch (e) {
            console.error('setbotpic error:', e.message);
            return sock.sendMessage(chatId, { text: `❌ Failed to update bot picture: ${e.message}` }, { quoted: message });
        }
    }
}

module.exports = { botimageCommand };
