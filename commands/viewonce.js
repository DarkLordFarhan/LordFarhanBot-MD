'use strict';

const {
    downloadContentFromMessage,
    jidNormalizedUser
} = require('@whiskeysockets/baileys');

/*
 * Unwrap WhatsApp message containers until we reach
 * the actual imageMessage/videoMessage.
 */
function unwrapMessage(msg) {
    let current = msg;

    for (let i = 0; i < 8 && current; i++) {

        if (current.viewOnceMessage?.message) {
            current = current.viewOnceMessage.message;
            continue;
        }

        if (current.viewOnceMessageV2?.message) {
            current = current.viewOnceMessageV2.message;
            continue;
        }

        if (current.viewOnceMessageV2Extension?.message) {
            current = current.viewOnceMessageV2Extension.message;
            continue;
        }

        if (current.ephemeralMessage?.message) {
            current = current.ephemeralMessage.message;
            continue;
        }

        if (current.documentWithCaptionMessage?.message) {
            current = current.documentWithCaptionMessage.message;
            continue;
        }

        break;
    }

    return current;
}

async function downloadMedia(mediaMessage, type) {
    const stream = await downloadContentFromMessage(mediaMessage, type);

    const chunks = [];

    for await (const chunk of stream) {
        chunks.push(chunk);
    }

    return Buffer.concat(chunks);
}

async function viewonceCommand(sock, chatId, message) {
    try {
        /*
         * The command must be a reply to another message.
         */
        const context =
            message?.message?.extendedTextMessage?.contextInfo;

        const quotedRaw = context?.quotedMessage;

        if (!quotedRaw) {
            return;
        }

        /*
         * Unwrap view-once containers.
         */
        const quoted = unwrapMessage(quotedRaw);

        if (!quoted) {
            return;
        }

        const imageMessage = quoted.imageMessage;
        const videoMessage = quoted.videoMessage;

        /*
         * Get the WhatsApp account running the bot.
         * jidNormalizedUser removes device suffixes such as :12.
         */
        const botInbox = sock.user?.id
            ? jidNormalizedUser(sock.user.id)
            : null;

        if (!botInbox) {
            return;
        }

        /*
         * VIEW-ONCE IMAGE
         */
        if (imageMessage) {
            const buffer = await downloadMedia(
                imageMessage,
                'image'
            );

            if (!buffer || !buffer.length) {
                return;
            }

            await sock.sendMessage(botInbox, {
                image: buffer,
                caption: imageMessage.caption || ''
            });

            return;
        }

        /*
         * VIEW-ONCE VIDEO
         */
        if (videoMessage) {
            const buffer = await downloadMedia(
                videoMessage,
                'video'
            );

            if (!buffer || !buffer.length) {
                return;
            }

            await sock.sendMessage(botInbox, {
                video: buffer,
                caption: videoMessage.caption || ''
            });

            return;
        }

        /*
         * Nothing usable was found.
         * Stay completely silent.
         */
        return;

    } catch (error) {
        /*
         * Silent failure.
         * Do NOT send anything back to the chat.
         */
        console.error('[VV] View-once processing failed:', error.message);
        return;
    }
}

module.exports = viewonceCommand;
