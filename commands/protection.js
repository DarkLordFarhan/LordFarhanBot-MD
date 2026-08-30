'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'protection.json');

const DEFAULTS = {
    antiBot: false,
    antiFlood: false,
    antiViewOnce: false,
    bots: []
};

function ensureFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(FILE)) {
        fs.writeFileSync(FILE, '{}');
    }
}

function load() {
    try {
        ensureFile();
        return JSON.parse(fs.readFileSync(FILE, 'utf8') || '{}');
    } catch {
        return {};
    }
}

function save(data) {
    ensureFile();
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function getConfig(chatId) {
    const data = load();

    if (!data[chatId]) {
        data[chatId] = { ...DEFAULTS };
        save(data);
    }

    return {
        ...DEFAULTS,
        ...data[chatId],
        bots: Array.isArray(data[chatId].bots)
            ? data[chatId].bots
            : []
    };
}

function updateConfig(chatId, changes) {
    const data = load();

    if (!data[chatId]) {
        data[chatId] = {
            ...DEFAULTS
        };
    }

    data[chatId] = {
        ...data[chatId],
        ...changes
    };

    if (!Array.isArray(data[chatId].bots)) {
        data[chatId].bots = [];
    }

    save(data);

    return data[chatId];
}

function getText(message) {
    return (
        message?.message?.conversation ||
        message?.message?.extendedTextMessage?.text ||
        message?.message?.imageMessage?.caption ||
        message?.message?.videoMessage?.caption ||
        message?.message?.documentMessage?.caption ||
        ''
    ).trim();
}

function normalizeJid(jid) {
    if (!jid) return null;

    let value = String(jid).trim();

    // Remove @lid if somebody accidentally supplies it.
    if (value.endsWith('@lid')) {
        return value;
    }

    // Already a WhatsApp user JID.
    if (value.endsWith('@s.whatsapp.net')) {
        return value;
    }

    // Strip common formatting.
    value = value
        .replace(/[^\d]/g, '');

    if (!value) return null;

    return `${value}@s.whatsapp.net`;
}

function extractMentionedJid(message) {
    const context =
        message?.message?.extendedTextMessage?.contextInfo ||
        message?.message?.imageMessage?.contextInfo ||
        message?.message?.videoMessage?.contextInfo ||
        message?.message?.documentMessage?.contextInfo ||
        {};

    if (Array.isArray(context.mentionedJid) && context.mentionedJid.length) {
        return context.mentionedJid[0];
    }

    // Reply to the bot's target.
    if (context.participant) {
        return context.participant;
    }

    return null;
}

/*
 * ----------------------------------------------------
 * ANTIBOT COMMANDS
 *
 * .antibot on
 * .antibot off
 * .antibot add @bot
 * .antibot remove @bot
 * .antibot list
 * .antibot status
 * ----------------------------------------------------
 */
async function antiBotCommand(
    sock,
    chatId,
    message,
    senderId,
    isGroup,
    isAdminUser
) {
    const text = getText(message);

    if (!text.toLowerCase().startsWith('.antibot')) {
        return false;
    }

    if (!isGroup) {
        await sock.sendMessage(
            chatId,
            {
                text: '❌ AntiBot can only be configured inside a group.'
            },
            { quoted: message }
        );

        return true;
    }

    if (!isAdminUser && !message.key.fromMe) {
        await sock.sendMessage(
            chatId,
            {
                text: '❌ Only group admins can configure AntiBot.'
            },
            { quoted: message }
        );

        return true;
    }

    const parts = text.split(/\s+/);
    const action = String(parts[1] || '').toLowerCase();

    const config = getConfig(chatId);

    // ---------------------------------------------
    // ON
    // ---------------------------------------------
    if (action === 'on' || action === 'enable') {
        updateConfig(chatId, {
            antiBot: true
        });

        await sock.sendMessage(
            chatId,
            {
                text:
`🛡️ *ANTIBOT ENABLED*

Registered bots are now blocked from using bot commands in this group.

Use:
.antibot add @bot
.antibot list
.antibot off`
            },
            { quoted: message }
        );

        return true;
    }

    // ---------------------------------------------
    // OFF
    // ---------------------------------------------
    if (action === 'off' || action === 'disable') {
        updateConfig(chatId, {
            antiBot: false
        });

        await sock.sendMessage(
            chatId,
            {
                text: '🛡️ AntiBot disabled.'
            },
            { quoted: message }
        );

        return true;
    }

    // ---------------------------------------------
    // ADD
    // ---------------------------------------------
    if (action === 'add') {
        let jid = extractMentionedJid(message);

        // Allow:
        // .antibot add 254700000000
        if (!jid && parts[2]) {
            jid = normalizeJid(parts[2]);
        }

        if (!jid) {
            await sock.sendMessage(
                chatId,
                {
                    text:
`❌ Mention or reply to the bot.

Example:
.antibot add @1234567890

You can also reply to the bot's message:
.antibot add`
                },
                { quoted: message }
            );

            return true;
        }

        jid = normalizeJid(jid);

        const bots = [...config.bots];

        if (bots.includes(jid)) {
            await sock.sendMessage(
                chatId,
                {
                    text: `⚠️ That participant is already registered as a bot.`
                },
                { quoted: message }
            );

            return true;
        }

        bots.push(jid);

        updateConfig(chatId, {
            bots
        });

        await sock.sendMessage(
            chatId,
            {
                text:
`✅ *BOT REGISTERED*

${jid}

This participant will now be blocked from using commands when AntiBot is ON.`
            },
            { quoted: message }
        );

        return true;
    }

    // ---------------------------------------------
    // REMOVE
    // ---------------------------------------------
    if (action === 'remove' || action === 'delete') {
        let jid = extractMentionedJid(message);

        if (!jid && parts[2]) {
            jid = normalizeJid(parts[2]);
        }

        if (!jid) {
            await sock.sendMessage(
                chatId,
                {
                    text:
`❌ Mention or reply to the registered bot.

Example:
.antibot remove @1234567890`
                },
                { quoted: message }
            );

            return true;
        }

        jid = normalizeJid(jid);

        const bots = config.bots.filter(x => x !== jid);

        updateConfig(chatId, {
            bots
        });

        await sock.sendMessage(
            chatId,
            {
                text: `✅ Removed ${jid} from the AntiBot list.`
            },
            { quoted: message }
        );

        return true;
    }

    // ---------------------------------------------
    // LIST
    // ---------------------------------------------
    if (action === 'list') {
        if (!config.bots.length) {
            await sock.sendMessage(
                chatId,
                {
                    text:
`🛡️ *ANTIBOT LIST*

No bots have been registered.

Add one with:
.antibot add @bot`
                },
                { quoted: message }
            );

            return true;
        }

        const list = config.bots
            .map((jid, i) => `${i + 1}. @${jid.split('@')[0]}`)
            .join('\n');

        await sock.sendMessage(
            chatId,
            {
                text:
`🛡️ *REGISTERED BOTS*

${list}

Status: ${config.antiBot ? '🟢 ON' : '🔴 OFF'}`
            },
            { quoted: message }
        );

        return true;
    }

    // ---------------------------------------------
    // STATUS
    // ---------------------------------------------
    if (action === 'status') {
        await sock.sendMessage(
            chatId,
            {
                text:
`🛡️ *ANTIBOT STATUS*

Protection: ${config.antiBot ? '🟢 ON' : '🔴 OFF'}
Registered bots: ${config.bots.length}

Use:
.antibot on
.antibot off
.antibot add @bot
.antibot remove @bot
.antibot list`
            },
            { quoted: message }
        );

        return true;
    }

    // ---------------------------------------------
    // HELP
    // ---------------------------------------------
    await sock.sendMessage(
        chatId,
        {
            text:
`🛡️ *ANTIBOT*

.antibot on
.antibot off
.antibot add @bot
.antibot remove @bot
.antibot list
.antibot status

AntiBot blocks commands from the
participants you register as bots.`
        },
        { quoted: message }
    );

    return true;
}

/*
 * ----------------------------------------------------
 * CHECK WHETHER A MESSAGE IS FROM A REGISTERED BOT
 * ----------------------------------------------------
 */
function isRegisteredBot(chatId, senderId) {
    const config = getConfig(chatId);

    if (!config.antiBot) {
        return false;
    }

    if (!senderId) {
        return false;
    }

    return config.bots.includes(senderId);
}

/*
 * ----------------------------------------------------
 * BLOCK REGISTERED BOT COMMANDS
 * ----------------------------------------------------
 */
async function handleAntiBotMessage(
    sock,
    chatId,
    message,
    senderId,
    isGroup
) {
    if (!isGroup) return false;

    const text = getText(message);

    // Only block commands, not normal conversation.
    if (!text.startsWith('.')) {
        return false;
    }

    if (!isRegisteredBot(chatId, senderId)) {
        return false;
    }

    /*
     * Delete the bot's command.
     *
     * This requires the bot to have sufficient
     * group permissions.
     */
    try {
        await sock.sendMessage(chatId, {
            delete: message.key
        });
    } catch (err) {
        console.error(
            'AntiBot delete error:',
            err?.message || err
        );
    }

    return true;
}

/*
 * ----------------------------------------------------
 * KEEP THESE OTHER PROTECTION EXPORTS COMPATIBLE
 * ----------------------------------------------------
 */

async function protectionCommand(
    sock,
    chatId,
    message,
    command,
    senderId,
    isGroup,
    isAdminUser
) {
    if (command === '.antibot') {
        return antiBotCommand(
            sock,
            chatId,
            message,
            senderId,
            isGroup,
            isAdminUser
        );
    }

    return false;
}

async function handleAntiFlood() {
    return false;
}

async function handleAntiViewOnce() {
    return false;
}

async function removeCommand(
    sock,
    chatId,
    message,
    senderId,
    isAdminUser
) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(
            chatId,
            {
                text: '❌ .remove only works in groups.'
            },
            { quoted: message }
        );

        return true;
    }

    if (!isAdminUser && !message.key.fromMe) {
        await sock.sendMessage(
            chatId,
            {
                text: '❌ Only group admins can use .remove.'
            },
            { quoted: message }
        );

        return true;
    }

    const context =
        message?.message?.extendedTextMessage?.contextInfo ||
        message?.message?.imageMessage?.contextInfo ||
        message?.message?.videoMessage?.contextInfo ||
        {};

    let target =
        context.mentionedJid?.[0] ||
        context.participant;

    if (!target) {
        await sock.sendMessage(
            chatId,
            {
                text:
`❌ Mention or reply to the person.

.remove @user

or reply to their message:
.remove`
            },
            { quoted: message }
        );

        return true;
    }

    try {
        await sock.groupParticipantsUpdate(
            chatId,
            [target],
            'remove'
        );

        return true;
    } catch (err) {
        console.error(
            'Remove error:',
            err?.message || err
        );

        await sock.sendMessage(
            chatId,
            {
                text:
'❌ Could not remove that participant. Make sure I am a group admin.'
            },
            { quoted: message }
        );

        return true;
    }
}

module.exports = {
    getConfig,
    protectionCommand,
    antiBotCommand,
    handleAntiBotMessage,
    handleAntiFlood,
    handleAntiViewOnce,
    removeCommand
};
