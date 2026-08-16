'use strict';

const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function botimageCommand(sock, chatId, message, cmd, senderId) {
    if (cmd !== '.setbotpic') return;

    const isOwnerOrSudo = require('../lib/isOwner');
    const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);

    if (!message.key.fromMe && !senderIsOwnerOrSudo) {
        return sock.sendMessage(chatId, {
            text: '❌ Only the bot owner/sudo can change the bot picture.'
        }, { quoted: message });
    }

    const quotedMessage =
        message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    const imageMessage = quotedMessage?.imageMessage;

    if (!imageMessage) {
        return sock.sendMessage(chatId, {
            text: '🖼️ *SET BOT PICTURE*\n\nReply to a photo with *.setbotpic* to change the bot/menu picture.\n\n⚠️ This does NOT change the WhatsApp profile picture.'
        }, { quoted: message });
    }

    try {
        await sock.sendMessage(chatId, {
            text: '⏳ Updating bot picture...'
        }, { quoted: message });

        const stream = await downloadContentFromMessage(
            imageMessage,
            'image'
        );

        let buffer = Buffer.alloc(0);

        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const imagePath = path.join(
            process.cwd(),
            'assets',
            'bot_image.jpg'
        );

        fs.mkdirSync(path.dirname(imagePath), {
            recursive: true
        });

        fs.writeFileSync(imagePath, buffer);

        return sock.sendMessage(chatId, {
            text: '✅ Bot picture updated successfully! 🖼️\n\nThe new picture will be used by the bot menu.'
        }, { quoted: message });

    } catch (error) {
        console.error('setbotpic error:', error);

        return sock.sendMessage(chatId, {
            text: `❌ Failed to save bot picture: ${error.message}`
        }, { quoted: message });
    }
}

module.exports = { botimageCommand };
