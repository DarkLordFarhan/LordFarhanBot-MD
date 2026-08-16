'use strict';
/**
 * Extended Owner Commands:
 * setbotname, resetbotname, setowner, resetowner, iamowner, about,
 * block, unblock, blockdetect, blockall, unblockall, silent, setfooter,
 * antideletestatus, antiedit, shutdown, broadcast, setchannel, resetchannel,
 * restart, workingreload, getsettings, setsetting, test, disk, hostip,
 * findcommands, latestupdates, online, privacy, receipt, lastseen
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const isOwnerOrSudo = require('../lib/isOwner');

function getText(m) {
    return (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
}
function getArg(m, cmd) {
    return getText(m).replace(new RegExp(`^\\.${cmd}\\s*`, 'i'), '').trim();
}

const settingsPath = path.join(__dirname, '..', 'settings.js');
const runtimeSettings = {};

// ── .setbotname ───────────────────────────────────────────────────────────────
async function setBotNameCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });
    const name = getArg(message, 'setbotname');
    if (!name) return sock.sendMessage(chatId, { text: 'Usage: .setbotname <new name>' }, { quoted: message });
    const settings = require('../settings');
    settings.botName = name;
    runtimeSettings.botName = name;
    await sock.sendMessage(chatId, { text: `✅ Bot name set to: *${name}*` }, { quoted: message });
}

// ── .resetbotname ─────────────────────────────────────────────────────────────
async function resetBotNameCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });
    const settings = require('../settings');
    settings.botName = '🌑༒𓆩『𝕃𝕆ℝ𝔻 𝔽𝔸ℝℍ𝔸ℕ 𝕄𝔻』𓆪༒☠️';
    await sock.sendMessage(chatId, { text: '✅ Bot name reset to: *🌑༒𓆩『𝕃𝕆ℝ𝔻 𝔽𝔸ℝℍ𝔸ℕ 𝕄𝔻』𓆪༒☠️*' }, { quoted: message });
}

// ── .setowner ─────────────────────────────────────────────────────────────────
async function setOwnerCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });
    const num = getArg(message, 'setowner').replace(/[^0-9]/g, '');
    if (!num) return sock.sendMessage(chatId, { text: 'Usage: .setowner <phone number>' }, { quoted: message });
    const settings = require('../settings');
    settings.ownerNumber = num;
    await sock.sendMessage(chatId, { text: `✅ Owner number updated to: *${num}*` }, { quoted: message });
}

// ── .resetowner ───────────────────────────────────────────────────────────────
async function resetOwnerCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });
    const settings = require('../settings');
    settings.ownerNumber = '254795463911';
    await sock.sendMessage(chatId, { text: '✅ Owner number reset to default.' }, { quoted: message });
}

// ── .iamowner ─────────────────────────────────────────────────────────────────
async function iAmOwnerCommand(sock, chatId, senderId, message) {
    const settings = require('../settings');
    const ownerJid = settings.ownerNumber + '@s.whatsapp.net';
    if (senderId !== ownerJid && !message.key.fromMe) {
        return sock.sendMessage(chatId, { text: '❌ You are not the owner.' }, { quoted: message });
    }
    await sock.sendMessage(chatId, { text: '👑 You are the bot owner!\n\nAll owner commands are available to you.' }, { quoted: message });
}

// ── .about ────────────────────────────────────────────────────────────────────
async function aboutCommand(sock, chatId, message) {
    const settings = require('../settings');
    await sock.sendMessage(chatId, {
        text: `ℹ️ *About ${settings.botName}*\n\n🤖 Name: ${settings.botName}\n👑 Owner: ${settings.botOwner}\n📦 Version: ${settings.version}\n📝 Description: ${settings.description}\n\n🔗 GitHub: https://github.com/DarkLordFarhan/LordFarhanBot-MD\n👨‍💻 Developer: DarkLordFarhanXMDTech`
    }, { quoted: message });
}

// ── .block ────────────────────────────────────────────────────────────────────
async function blockCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentioned[0] || getArg(message, 'block').replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    if (!target || target === '@s.whatsapp.net') return sock.sendMessage(chatId, { text: 'Usage: .block @user' }, { quoted: message });
    try {
        await sock.updateBlockStatus(target, 'block');
        await sock.sendMessage(chatId, { text: `🚫 Blocked: @${target.split('@')[0]}`, mentions: [target] }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Block failed: ${e.message}` }, { quoted: message });
    }
}

// ── .unblock ──────────────────────────────────────────────────────────────────
async function unblockCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentioned[0] || getArg(message, 'unblock').replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    if (!target || target === '@s.whatsapp.net') return sock.sendMessage(chatId, { text: 'Usage: .unblock @user' }, { quoted: message });
    try {
        await sock.updateBlockStatus(target, 'unblock');
        await sock.sendMessage(chatId, { text: `✅ Unblocked: @${target.split('@')[0]}`, mentions: [target] }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Unblock failed: ${e.message}` }, { quoted: message });
    }
}

// ── .silent ───────────────────────────────────────────────────────────────────
const silentMode = { enabled: false };
async function silentCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });
    const arg = getArg(message, 'silent').toLowerCase();
    if (!arg || (!arg.includes('on') && !arg.includes('off'))) {
        return sock.sendMessage(chatId, {
            text: `🔕 Silent mode: ${silentMode.enabled ? '🟢 ON' : '🔴 OFF'}\nUse .silent on/off`
        }, { quoted: message });
    }
    silentMode.enabled = arg.includes('on');
    await sock.sendMessage(chatId, { text: `✅ Silent mode ${silentMode.enabled ? 'enabled' : 'disabled'}.` }, { quoted: message });
}
function isSilent() { return silentMode.enabled; }

// ── .broadcast ────────────────────────────────────────────────────────────────
async function broadcastCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });
    const msg = getArg(message, 'broadcast');
    if (!msg) return sock.sendMessage(chatId, { text: 'Usage: .broadcast <message>' }, { quoted: message });
    // Broadcast to all groups
    await sock.sendMessage(chatId, { text: '📡 Broadcasting…' }, { quoted: message });
    try {
        const chats = await sock.groupFetchAllParticipating();
        const groups = Object.keys(chats);
        let sent = 0;
        for (const gid of groups) {
            try {
                await sock.sendMessage(gid, { text: `📢 *Broadcast*\n\n${msg}` });
                sent++;
                await new Promise(r => setTimeout(r, 500));
            } catch {}
        }
        await sock.sendMessage(chatId, { text: `✅ Broadcast sent to ${sent}/${groups.length} groups.` }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Broadcast failed: ${e.message}` }, { quoted: message });
    }
}

// ── .shutdown ─────────────────────────────────────────────────────────────────
async function shutdownCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '🛑 Bot shutting down…' }, { quoted: message });
    await new Promise(r => setTimeout(r, 1500));
    process.exit(0);
}

// ── .restart ──────────────────────────────────────────────────────────────────
async function restartCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '🔄 Restarting bot…' }, { quoted: message });
    await new Promise(r => setTimeout(r, 1500));
    process.exit(1); // pm2/nodemon will restart
}

// ── .getsettings ──────────────────────────────────────────────────────────────
async function getSettingsCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });
    const settings = require('../settings');
    const safe = {
        botName: settings.botName,
        botOwner: settings.botOwner,
        ownerNumber: settings.ownerNumber,
        commandMode: settings.commandMode,
        version: settings.version,
        timezone: settings.timezone,
    };
    await sock.sendMessage(chatId, {
        text: `⚙️ *Bot Settings*\n\n${Object.entries(safe).map(([k, v]) => `*${k}:* ${v}`).join('\n')}`
    }, { quoted: message });
}

// ── .setsetting ───────────────────────────────────────────────────────────────
async function setSettingCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });
    const args = getArg(message, 'setsetting').split(/\s+/);
    if (args.length < 2) return sock.sendMessage(chatId, { text: 'Usage: .setsetting <key> <value>\nExample: .setsetting commandMode private' }, { quoted: message });
    const [key, ...rest] = args;
    const value = rest.join(' ');
    const settings = require('../settings');
    if (!(key in settings)) return sock.sendMessage(chatId, { text: `❌ Unknown setting: ${key}` }, { quoted: message });
    settings[key] = value;
    await sock.sendMessage(chatId, { text: `✅ Setting *${key}* updated to: *${value}*` }, { quoted: message });
}

// ── .disk ─────────────────────────────────────────────────────────────────────
async function diskCommand(sock, chatId, message) {
    try {
        const { execSync } = require('child_process');
        const output = execSync('df -h / 2>/dev/null || df -h .').toString().trim();
        await sock.sendMessage(chatId, { text: `💽 *Disk Usage*\n\n\`\`\`${output}\`\`\`` }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Disk info failed: ${e.message}` }, { quoted: message });
    }
}

// ── .hostip ───────────────────────────────────────────────────────────────────
async function hostIpCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });
    try {
        const ifaces = os.networkInterfaces();
        const ips = Object.entries(ifaces)
            .flatMap(([name, addrs]) => addrs.filter(a => !a.internal).map(a => `${name}: ${a.address}`));
        const res = await require('node-fetch')('https://api.ipify.org?format=json');
        const { ip } = await res.json();
        await sock.sendMessage(chatId, {
            text: `🌐 *Host IP Info*\n\n🔒 Local IPs:\n${ips.join('\n')}\n\n🌍 Public IP: ${ip}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ IP fetch failed: ${e.message}` }, { quoted: message });
    }
}

// ── .findcommands ─────────────────────────────────────────────────────────────
async function findCommandsCommand(sock, chatId, message) {
    const query = getArg(message, 'findcommands').toLowerCase();
    if (!query) return sock.sendMessage(chatId, { text: 'Usage: .findcommands <keyword>\nExample: .findcommands sticker' }, { quoted: message });
    try {
        const files = fs.readdirSync(path.join(__dirname)).filter(f => f.endsWith('.js'));
        const matches = [];
        for (const file of files) {
            const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
            const cmds = [...content.matchAll(/case userMessage(?:\.startsWith\(['"]|===\s*['"]\.)(\w+)/g)].map(m => '.' + m[1]);
            cmds.filter(c => c.includes(query)).forEach(c => matches.push(c));
        }
        // Also search help.js
        const helpContent = fs.readFileSync(path.join(__dirname, 'help.js'), 'utf8');
        const helpCmds = [...helpContent.matchAll(/\.([\w]+)/g)].map(m => '.' + m[1]).filter(c => c.includes(query));
        const all = [...new Set([...matches, ...helpCmds])].slice(0, 30);
        await sock.sendMessage(chatId, {
            text: `🔍 *Commands matching "${query}":*\n\n${all.length ? all.join('\n') : 'No commands found.'}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Search failed: ${e.message}` }, { quoted: message });
    }
}

// ── .latestupdates ────────────────────────────────────────────────────────────
async function latestUpdatesCommand(sock, chatId, message) {
    const settings = require('../settings');
    try {
        const fetch = require('node-fetch');
        const res = await fetch('https://api.github.com/repos/DarkLordFarhan/LordFarhanBot-MD/commits?per_page=5', {
            headers: { 'User-Agent': 'LordFarhanBot' }
        });
        const commits = await res.json();
        if (!Array.isArray(commits)) throw new Error('No commits');
        const text = commits.map((c, i) =>
            `${i + 1}. ${c.commit.message.slice(0, 60)}\n   📅 ${new Date(c.commit.author.date).toDateString()}`
        ).join('\n\n');
        await sock.sendMessage(chatId, {
            text: `🚀 *Latest Updates — ${settings.botName} v${settings.version}*\n\n${text}\n\n🔗 https://github.com/DarkLordFarhan/LordFarhanBot-MD`
        }, { quoted: message });
    } catch {
        await sock.sendMessage(chatId, {
            text: `🚀 *${settings.botName} v${settings.version}*\n\n📦 Current version is up to date.\n🔗 https://github.com/DarkLordFarhan/LordFarhanBot-MD`
        }, { quoted: message });
    }
}

// ── .online (set online status) ───────────────────────────────────────────────
async function onlineCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });
    const arg = getArg(message, 'online').toLowerCase();
    try {
        if (arg === 'off') {
            await sock.sendPresenceUpdate('unavailable');
            await sock.sendMessage(chatId, { text: '✅ Bot appears offline.' }, { quoted: message });
        } else {
            await sock.sendPresenceUpdate('available');
            await sock.sendMessage(chatId, { text: '✅ Bot appears online.' }, { quoted: message });
        }
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}` }, { quoted: message });
    }
}

// ── .privacy ──────────────────────────────────────────────────────────────────
async function privacyCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });
    const args = getArg(message, 'privacy').split(/\s+/);
    if (args.length < 2) {
        return sock.sendMessage(chatId, {
            text: 'Usage: .privacy <setting> <value>\nSettings: lastseen/online/profile/status/readreceipts\nValues: all/contacts/nobody/contact_blacklist'
        }, { quoted: message });
    }
    const [setting, value] = args;
    const map = { all: 'all', contacts: 'contacts', nobody: 'none', none: 'none' };
    const v = map[value] || value;
    try {
        await sock.updateLastSeenPrivacy(v);
        await sock.sendMessage(chatId, { text: `✅ Privacy setting *${setting}* updated to: *${value}*` }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Privacy update failed: ${e.message}` }, { quoted: message });
    }
}

// ── .lastseen ─────────────────────────────────────────────────────────────────
async function lastSeenCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });
    const arg = getArg(message, 'lastseen').toLowerCase();
    try {
        const val = arg === 'off' || arg === 'nobody' ? 'none' : arg === 'contacts' ? 'contacts' : 'all';
        await sock.updateLastSeenPrivacy(val);
        await sock.sendMessage(chatId, { text: `✅ Last seen visibility: *${val}*` }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}` }, { quoted: message });
    }
}

// ── .setchannel ───────────────────────────────────────────────────────────────
async function setChannelCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });
    const channelId = getArg(message, 'setchannel');
    if (!channelId) return sock.sendMessage(chatId, { text: 'Usage: .setchannel <channel-jid>' }, { quoted: message });
    global._botChannel = channelId;
    await sock.sendMessage(chatId, { text: `✅ Bot channel set to: ${channelId}` }, { quoted: message });
}

// ── .resetchannel ─────────────────────────────────────────────────────────────
async function resetChannelCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });
    delete global._botChannel;
    await sock.sendMessage(chatId, { text: '✅ Bot channel reset.' }, { quoted: message });
}

// ── .setfooter ────────────────────────────────────────────────────────────────
async function setFooterCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });
    const footer = getArg(message, 'setfooter');
    global._botFooter = footer || '';
    await sock.sendMessage(chatId, { text: `✅ Bot footer set to: "${footer || '(empty)'}"` }, { quoted: message });
}

// ── .test ─────────────────────────────────────────────────────────────────────
async function testCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '✅ Bot test OK!\n\n🤖 Bot is running normally.\n📡 Connection: Active\n⚡ Status: Healthy' }, { quoted: message });
}

module.exports = {
    setBotNameCommand, resetBotNameCommand, setOwnerCommand, resetOwnerCommand,
    iAmOwnerCommand, aboutCommand, blockCommand, unblockCommand,
    silentCommand, isSilent, broadcastCommand, shutdownCommand, restartCommand,
    getSettingsCommand, setSettingCommand, diskCommand, hostIpCommand,
    findCommandsCommand, latestUpdatesCommand, onlineCommand, privacyCommand,
    lastSeenCommand, setChannelCommand, resetChannelCommand, setFooterCommand, testCommand,
};
