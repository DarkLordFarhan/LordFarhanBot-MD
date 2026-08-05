'use strict';
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

/**
 * .setbotpic  – anyone can set the bot's profile picture by replying to any image.
 *               Owner/sudo can also pass a URL: .setbotpic <url>
 */
async function botimageCommand(sock, chatId, message, cmd, senderId) {
    if (cmd !== '.setbotpic') return;

    const isOwnerOrSudo = require('../lib/isOwner');
    const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);

    // Check for image URL (owner/sudo only shortcut)
    const text = (
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text || ''
    ).trim();
    const urlArg = text.split(' ').slice(1).join(' ').trim();
    if (urlArg && /^https?:\/\//i.test(urlArg)) {
        if (!message.key.fromMe && !senderIsOwnerOrSudo) {
            return sock.sendMessage(chatId, { text: '❌ Only owner/sudo can set bot pic via URL.' }, { quoted: message });
        }
        try {
            await sock.updateProfilePicture(sock.user.id, { url: urlArg });
            return sock.sendMessage(chatId, {
                text: `✅ Bot profile picture updated from URL! 🖼️`
            }, { quoted: message });
        } catch (e) {
            return sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}` }, { quoted: message });
        }
    }

    // Grab image from reply or direct image in message
    const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const directImage = message.message?.imageMessage;
    const imageMessage = directImage || quotedMessage?.imageMessage || quotedMessage?.stickerMessage;

    if (!imageMessage) {
        return sock.sendMessage(chatId, {
            text: `🖼️ *Set Bot Picture*\n\n*How to use:*\n1️⃣ Reply to any image with *.setbotpic*\n2️⃣ Or send an image with caption *.setbotpic*\n3️⃣ Owner can also do: *.setbotpic <image url>*\n\n_Anyone can change the bot's profile picture!_`
        }, { quoted: message });
    }

    try {
        await sock.sendMessage(chatId, { text: '⏳ Updating bot profile picture…' }, { quoted: message });

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const msgType = quotedMessage?.stickerMessage ? 'sticker' : 'image';
        const stream = await downloadContentFromMessage(imageMessage, msgType);
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

module.exports = { botimageCommand };
