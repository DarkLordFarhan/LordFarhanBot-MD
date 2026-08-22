const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function viewonceCommand(sock, chatId, message) {
    // Get the bot's own WhatsApp JID
    const botJid = sock.user?.id;

    if (!botJid) {
        return await sock.sendMessage(chatId, {
            text: '❌ Bot WhatsApp ID is not available.'
        }, { quoted: message });
    }

    // Extract the replied message
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedImage = quoted?.imageMessage;
    const quotedVideo = quoted?.videoMessage;

    if (quotedImage && quotedImage.viewOnce) {
        const stream = await downloadContentFromMessage(quotedImage, 'image');
        let buffer = Buffer.from([]);

        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        await sock.sendMessage(botJid, {
            image: buffer,
            fileName: 'media.jpg',
            caption: quotedImage.caption || '📥 View Once Image'
        });

        await sock.sendMessage(chatId, {
            text: '✅ View-once image sent to your inbox.'
        }, { quoted: message });

    } else if (quotedVideo && quotedVideo.viewOnce) {
        const stream = await downloadContentFromMessage(quotedVideo, 'video');
        let buffer = Buffer.from([]);

        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        await sock.sendMessage(botJid, {
            video: buffer,
            fileName: 'media.mp4',
            caption: quotedVideo.caption || '📥 View Once Video'
        });

        await sock.sendMessage(chatId, {
            text: '✅ View-once video sent to your inbox.'
        }, { quoted: message });

    } else {
        await sock.sendMessage(chatId, {
            text: '❌ Please reply to a view-once image or video.'
        }, { quoted: message });
    }
}

module.exports = viewonceCommand;
