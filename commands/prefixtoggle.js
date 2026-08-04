'use strict';
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'botsettings.json');

function readSettings() { try { return JSON.parse(fs.readFileSync(SETTINGS_FILE)); } catch (_) { return {}; } }
function writeSettings(d) { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(SETTINGS_FILE, JSON.stringify(d, null, 2)); }

/**
 * .prefixtoggle  – owner/sudo only: enable/disable the '.' prefix requirement.
 *                  When prefix is OFF, commands work without the leading dot.
 * .setprefix <x> – change the active prefix character (owner/sudo only).
 * .prefixinfo    – show current prefix status (anyone).
 */
async function prefixToggleCommand(sock, chatId, message, cmd, args, senderId) {
    const isOwnerOrSudo = require('../lib/isOwner');
    const settings = readSettings();

    if (cmd === '.prefixinfo') {
        const enabled = settings.prefixEnabled !== false; // default ON
        const char = settings.prefixChar || '.';
        return sock.sendMessage(chatId, {
            text: `🔤 *Prefix Info*\n\nStatus: ${enabled ? '🟢 Enabled' : '🔴 Disabled'}\nCharacter: *${char}*\n\n${enabled ? `Commands need to start with *${char}*\nExample: *${char}menu*` : 'Commands work *without* a prefix\nExample: *menu*'}`
        }, { quoted: message });
    }

    // All other prefix commands are owner/sudo only
    const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!message.key.fromMe && !senderIsOwnerOrSudo) {
        return sock.sendMessage(chatId, { text: '❌ Only owner/sudo can change prefix settings.' }, { quoted: message });
    }

    if (cmd === '.prefixtoggle') {
        // Toggle prefix requirement on/off
        const wasEnabled = settings.prefixEnabled !== false;
        settings.prefixEnabled = !wasEnabled;
        writeSettings(settings);
        const char = settings.prefixChar || '.';
        return sock.sendMessage(chatId, {
            text: `🔤 *Prefix Toggle*\n\nPrefix is now ${settings.prefixEnabled ? `🟢 *ON*\nCommands require *${char}* prefix.\nExample: *${char}menu*` : `🔴 *OFF*\nCommands work without a prefix.\nExample: *menu*`}`
        }, { quoted: message });
    }

    if (cmd === '.setprefix') {
        const newPrefix = args[0]?.trim();
        if (!newPrefix || newPrefix.length > 3) {
            return sock.sendMessage(chatId, { text: '❌ Usage: .setprefix <character>\nExample: .setprefix !\nMax 3 characters.' }, { quoted: message });
        }
        const oldPrefix = settings.prefixChar || '.';
        settings.prefixChar = newPrefix;
        // Keep prefix enabled by default when changing character
        if (settings.prefixEnabled === undefined) settings.prefixEnabled = true;
        writeSettings(settings);
        return sock.sendMessage(chatId, {
            text: `✅ *Prefix Changed*\n\nOld: *${oldPrefix}*\nNew: *${newPrefix}*\n\nCommands now use *${newPrefix}* prefix.\nExample: *${newPrefix}menu*`
        }, { quoted: message });
    }
}

/**
 * Called once at the top of handleMessages to normalise the incoming userMessage.
 * Returns the (possibly prefixed) userMessage to use for all case matching.
 */
function applyPrefixLogic(userMessage) {
    const settings = readSettings();
    const prefixEnabled = settings.prefixEnabled !== false; // default ON
    const prefixChar = settings.prefixChar || '.';

    // If using a custom prefix, translate it to '.' so all existing cases work
    if (prefixEnabled && prefixChar !== '.') {
        if (userMessage.startsWith(prefixChar)) {
            return '.' + userMessage.slice(prefixChar.length);
        }
        return userMessage; // doesn't start with prefix → not a command
    }

    // Prefix OFF: if message doesn't start with '.', prepend it so cases match
    if (!prefixEnabled && !userMessage.startsWith('.')) {
        return '.' + userMessage;
    }

    return userMessage;
}

module.exports = { prefixToggleCommand, applyPrefixLogic };
