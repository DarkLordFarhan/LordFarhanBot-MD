'use strict';
/**
 * Extended Group Management Commands:
 * add, promoteall, demoteall, kickall, ex, clearbanlist,
 * resetwarn, setwarn, gctime, antileave, addbadword, removebadword,
 * listbadword, leave, creategroup, grouplink, tagadmin, getgpp,
 * togstatus, getparticipants, listonline, listinactive,
 * approveall, rejectall, stickerpack, disp, link, fangtrace
 */

const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');
const isOwnerOrSudo = require('../lib/isOwner');

// ── helpers ───────────────────────────────────────────────────────────────────
function getText(m) {
    return (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
}
function getMentioned(m) {
    return m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
}
function getGroupParticipants(metadata) {
    return (metadata?.participants || []).map(p => p.id);
}

// persist badword list per group
const badwordFile = path.join(__dirname, '..', 'data', 'badwords.json');
function loadBadwords() {
    try { return JSON.parse(fs.readFileSync(badwordFile)); } catch { return {}; }
}
function saveBadwords(data) {
    fs.writeFileSync(badwordFile, JSON.stringify(data, null, 2));
}

// persist antileave / automod per group
const antileaveFile = path.join(__dirname, '..', 'data', 'antileave.json');
function loadAntileave() {
    try { return JSON.parse(fs.readFileSync(antileaveFile)); } catch { return {}; }
}
function saveAntileave(data) {
    fs.writeFileSync(antileaveFile, JSON.stringify(data, null, 2));
}

// ── .add ──────────────────────────────────────────────────────────────────────
async function addCommand(sock, chatId, senderId, message) {
    if (!chatId.endsWith('@g.us'))
        return sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: message });
    const admin = await isAdmin(sock, chatId, senderId);
    if (!admin)
        return sock.sendMessage(chatId, { text: '❌ Admins only.' }, { quoted: message });

    const text = getText(message);
    const num = text.replace(/^\.(add)\s*/i, '').replace(/[^0-9]/g, '');
    if (!num)
        return sock.sendMessage(chatId, { text: 'Usage: .add <number>\nExample: .add 2547xxxxxxxx' }, { quoted: message });

    const jid = num + '@s.whatsapp.net';
    try {
        await sock.groupParticipantsUpdate(chatId, [jid], 'add');
        await sock.sendMessage(chatId, { text: `✅ Added ${num} to the group.` }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Could not add ${num}: ${e.message}` }, { quoted: message });
    }
}

// ── .promoteall ───────────────────────────────────────────────────────────────
async function promoteAllCommand(sock, chatId, senderId, message) {
    if (!chatId.endsWith('@g.us'))
        return sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: message });
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo)
        return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });

    const meta = await sock.groupMetadata(chatId);
    const toPromote = meta.participants.filter(p => !p.isAdmin && !p.isSuperAdmin).map(p => p.id);
    if (!toPromote.length)
        return sock.sendMessage(chatId, { text: '✅ Everyone is already an admin.' }, { quoted: message });

    await sock.sendMessage(chatId, { text: `⏳ Promoting ${toPromote.length} members…` }, { quoted: message });
    for (const jid of toPromote) {
        try { await sock.groupParticipantsUpdate(chatId, [jid], 'promote'); } catch {}
    }
    await sock.sendMessage(chatId, { text: `✅ Promoted ${toPromote.length} members to admin.` }, { quoted: message });
}

// ── .demoteall ────────────────────────────────────────────────────────────────
async function demoteAllCommand(sock, chatId, senderId, message) {
    if (!chatId.endsWith('@g.us'))
        return sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: message });
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo)
        return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });

    const meta = await sock.groupMetadata(chatId);
    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
    const ownerJid = meta.participants.find(p => p.isSuperAdmin)?.id;
    const toDemote = meta.participants
        .filter(p => p.isAdmin && p.id !== botJid && p.id !== ownerJid)
        .map(p => p.id);

    if (!toDemote.length)
        return sock.sendMessage(chatId, { text: '✅ No admins to demote.' }, { quoted: message });

    await sock.sendMessage(chatId, { text: `⏳ Demoting ${toDemote.length} admins…` }, { quoted: message });
    for (const jid of toDemote) {
        try { await sock.groupParticipantsUpdate(chatId, [jid], 'demote'); } catch {}
    }
    await sock.sendMessage(chatId, { text: `✅ Demoted ${toDemote.length} admins.` }, { quoted: message });
}

// ── .kickall ──────────────────────────────────────────────────────────────────
async function kickAllCommand(sock, chatId, senderId, message) {
    if (!chatId.endsWith('@g.us'))
        return sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: message });
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo)
        return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });

    const meta = await sock.groupMetadata(chatId);
    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
    const toKick = meta.participants
        .filter(p => !p.isAdmin && !p.isSuperAdmin && p.id !== botJid)
        .map(p => p.id);

    if (!toKick.length)
        return sock.sendMessage(chatId, { text: '✅ No non-admin members to kick.' }, { quoted: message });

    await sock.sendMessage(chatId, { text: `⚠️ Kicking ${toKick.length} members…` }, { quoted: message });
    for (const jid of toKick) {
        try { await sock.groupParticipantsUpdate(chatId, [jid], 'remove'); } catch {}
    }
    await sock.sendMessage(chatId, { text: `✅ Kicked ${toKick.length} members.` }, { quoted: message });
}

// ── .ex (soft-ban: kick then re-add) ─────────────────────────────────────────
async function exCommand(sock, chatId, senderId, message) {
    if (!chatId.endsWith('@g.us'))
        return sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: message });
    const admin = await isAdmin(sock, chatId, senderId);
    if (!admin)
        return sock.sendMessage(chatId, { text: '❌ Admins only.' }, { quoted: message });

    const mentioned = getMentioned(message);
    if (!mentioned.length)
        return sock.sendMessage(chatId, { text: 'Usage: .ex @user' }, { quoted: message });

    const jid = mentioned[0];
    try {
        await sock.groupParticipantsUpdate(chatId, [jid], 'remove');
        await new Promise(r => setTimeout(r, 800));
        await sock.groupParticipantsUpdate(chatId, [jid], 'add');
        await sock.sendMessage(chatId, { text: `✅ @${jid.split('@')[0]} has been re-added (ex-kicked).`, mentions: [jid] }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}` }, { quoted: message });
    }
}

// ── .clearbanlist ─────────────────────────────────────────────────────────────
async function clearBanListCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo)
        return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });

    const file = path.join(__dirname, '..', 'data', 'banned.json');
    try {
        const data = JSON.parse(fs.readFileSync(file));
        const count = Object.keys(data).length;
        fs.writeFileSync(file, '{}');
        await sock.sendMessage(chatId, { text: `✅ Ban list cleared. Removed ${count} entries.` }, { quoted: message });
    } catch {
        await sock.sendMessage(chatId, { text: '✅ Ban list is already empty.' }, { quoted: message });
    }
}

// ── .resetwarn ────────────────────────────────────────────────────────────────
async function resetWarnCommand(sock, chatId, senderId, message) {
    if (!chatId.endsWith('@g.us'))
        return sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: message });
    const admin = await isAdmin(sock, chatId, senderId);
    if (!admin)
        return sock.sendMessage(chatId, { text: '❌ Admins only.' }, { quoted: message });

    const mentioned = getMentioned(message);
    const file = path.join(__dirname, '..', 'data', 'warnings.json');
    try {
        const data = JSON.parse(fs.readFileSync(file));
        if (mentioned.length) {
            const jid = mentioned[0];
            if (data[chatId]?.[jid]) delete data[chatId][jid];
            fs.writeFileSync(file, JSON.stringify(data, null, 2));
            await sock.sendMessage(chatId, { text: `✅ Warnings reset for @${jid.split('@')[0]}.`, mentions: [jid] }, { quoted: message });
        } else {
            if (data[chatId]) delete data[chatId];
            fs.writeFileSync(file, JSON.stringify(data, null, 2));
            await sock.sendMessage(chatId, { text: '✅ All warnings reset for this group.' }, { quoted: message });
        }
    } catch {
        await sock.sendMessage(chatId, { text: '✅ No warnings to reset.' }, { quoted: message });
    }
}

// ── .setwarn <number> ─────────────────────────────────────────────────────────
async function setWarnCommand(sock, chatId, senderId, message) {
    const admin = await isAdmin(sock, chatId, senderId);
    if (!admin)
        return sock.sendMessage(chatId, { text: '❌ Admins only.' }, { quoted: message });

    const args = getText(message).split(/\s+/).slice(1);
    const n = parseInt(args[0]);
    if (!n || n < 1 || n > 20)
        return sock.sendMessage(chatId, { text: 'Usage: .setwarn <1-20>\nExample: .setwarn 5' }, { quoted: message });

    const { WARN_COUNT } = require('../config');
    // patch runtime only (persisting config edits is complex)
    global._warnCount = global._warnCount || {};
    global._warnCount[chatId] = n;
    await sock.sendMessage(chatId, { text: `✅ Warning limit set to *${n}* for this group.` }, { quoted: message });
}

// ── .gctime ───────────────────────────────────────────────────────────────────
async function gctimeCommand(sock, chatId, message) {
    if (!chatId.endsWith('@g.us'))
        return sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: message });
    const meta = await sock.groupMetadata(chatId);
    const created = new Date(meta.creation * 1000);
    const now = new Date();
    const diffMs = now - created;
    const days = Math.floor(diffMs / 86400000);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    await sock.sendMessage(chatId, {
        text: `🕒 *Group Creation Time*\n\n📅 Created: ${created.toDateString()}\n⏱ Age: ${years > 0 ? years + ' year(s), ' : ''}${months % 12} month(s), ${days % 30} day(s)`
    }, { quoted: message });
}

// ── .antileave ────────────────────────────────────────────────────────────────
async function antileaveCommand(sock, chatId, senderId, message) {
    if (!chatId.endsWith('@g.us'))
        return sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: message });
    const admin = await isAdmin(sock, chatId, senderId);
    if (!admin)
        return sock.sendMessage(chatId, { text: '❌ Admins only.' }, { quoted: message });

    const data = loadAntileave();
    const text = getText(message).toLowerCase();
    const enable = text.includes('on') || text.includes('enable');
    const disable = text.includes('off') || text.includes('disable');

    if (!enable && !disable) {
        const current = data[chatId]?.antileave ? '🟢 ON' : '🔴 OFF';
        return sock.sendMessage(chatId, { text: `Anti-leave is currently: ${current}\nUse .antileave on/off` }, { quoted: message });
    }
    data[chatId] = data[chatId] || {};
    data[chatId].antileave = enable;
    saveAntileave(data);
    await sock.sendMessage(chatId, { text: `✅ Anti-leave ${enable ? 'enabled' : 'disabled'}.` }, { quoted: message });
}

// ── .addbadword ───────────────────────────────────────────────────────────────
async function addBadwordCommand(sock, chatId, senderId, message) {
    const admin = await isAdmin(sock, chatId, senderId);
    if (!admin)
        return sock.sendMessage(chatId, { text: '❌ Admins only.' }, { quoted: message });

    const word = getText(message).split(/\s+/).slice(1).join(' ').toLowerCase().trim();
    if (!word)
        return sock.sendMessage(chatId, { text: 'Usage: .addbadword <word>' }, { quoted: message });

    const data = loadBadwords();
    data[chatId] = data[chatId] || [];
    if (!data[chatId].includes(word)) data[chatId].push(word);
    saveBadwords(data);
    await sock.sendMessage(chatId, { text: `✅ Added "*${word}*" to bad word list.` }, { quoted: message });
}

// ── .removebadword ────────────────────────────────────────────────────────────
async function removeBadwordCommand(sock, chatId, senderId, message) {
    const admin = await isAdmin(sock, chatId, senderId);
    if (!admin)
        return sock.sendMessage(chatId, { text: '❌ Admins only.' }, { quoted: message });

    const word = getText(message).split(/\s+/).slice(1).join(' ').toLowerCase().trim();
    if (!word)
        return sock.sendMessage(chatId, { text: 'Usage: .removebadword <word>' }, { quoted: message });

    const data = loadBadwords();
    if (!data[chatId]?.includes(word))
        return sock.sendMessage(chatId, { text: `❌ "${word}" is not in the bad word list.` }, { quoted: message });

    data[chatId] = data[chatId].filter(w => w !== word);
    saveBadwords(data);
    await sock.sendMessage(chatId, { text: `✅ Removed "*${word}*" from bad word list.` }, { quoted: message });
}

// ── .listbadword ──────────────────────────────────────────────────────────────
async function listBadwordCommand(sock, chatId, message) {
    const data = loadBadwords();
    const words = data[chatId] || [];
    if (!words.length)
        return sock.sendMessage(chatId, { text: '✅ No bad words configured for this group.' }, { quoted: message });

    await sock.sendMessage(chatId, {
        text: `🚫 *Bad Word List (${words.length})*\n\n${words.map((w, i) => `${i + 1}. ${w}`).join('\n')}`
    }, { quoted: message });
}

// ── .leave ────────────────────────────────────────────────────────────────────
async function leaveCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo)
        return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });

    await sock.sendMessage(chatId, { text: '👋 Goodbye! Bot is leaving the group.' }, { quoted: message });
    await new Promise(r => setTimeout(r, 1500));
    await sock.groupLeave(chatId);
}

// ── .creategroup ──────────────────────────────────────────────────────────────
async function createGroupCommand(sock, chatId, senderId, message) {
    const sudo = await isOwnerOrSudo(senderId, sock, chatId);
    if (!sudo)
        return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.' }, { quoted: message });

    const name = getText(message).replace(/^\.creategroup\s*/i, '').trim();
    if (!name)
        return sock.sendMessage(chatId, { text: 'Usage: .creategroup <Group Name>' }, { quoted: message });

    try {
        const result = await sock.groupCreate(name, [senderId]);
        await sock.sendMessage(chatId, { text: `✅ Group "*${name}*" created!\nJID: ${result.id}` }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Failed to create group: ${e.message}` }, { quoted: message });
    }
}

// ── .grouplink / .link / .invite ──────────────────────────────────────────────
async function groupLinkCommand(sock, chatId, senderId, message) {
    if (!chatId.endsWith('@g.us'))
        return sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: message });
    const admin = await isAdmin(sock, chatId, senderId);
    if (!admin)
        return sock.sendMessage(chatId, { text: '❌ Admins only.' }, { quoted: message });

    try {
        const code = await sock.groupInviteCode(chatId);
        await sock.sendMessage(chatId, {
            text: `🔗 *Group Invite Link*\nhttps://chat.whatsapp.com/${code}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Could not fetch link: ${e.message}` }, { quoted: message });
    }
}

// ── .tagadmin ─────────────────────────────────────────────────────────────────
async function tagAdminCommand(sock, chatId, senderId, message) {
    if (!chatId.endsWith('@g.us'))
        return sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: message });
    const meta = await sock.groupMetadata(chatId);
    const admins = meta.participants.filter(p => p.isAdmin || p.isSuperAdmin);

    if (!admins.length)
        return sock.sendMessage(chatId, { text: '❌ No admins found.' }, { quoted: message });

    const text = getText(message).replace(/^\.tagadmin\s*/i, '').trim();
    const mention = admins.map(a => a.id);
    const tagLine = admins.map(a => `@${a.id.split('@')[0]}`).join(' ');
    await sock.sendMessage(chatId, {
        text: `👮 *Tagging Admins*\n\n${tagLine}${text ? '\n\n📢 ' + text : ''}`,
        mentions: mention
    }, { quoted: message });
}

// ── .getgpp (get group profile picture) ───────────────────────────────────────
async function getGppCommand(sock, chatId, message) {
    if (!chatId.endsWith('@g.us'))
        return sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: message });
    try {
        const url = await sock.profilePictureUrl(chatId, 'image');
        await sock.sendMessage(chatId, {
            image: { url },
            caption: '📸 Group Profile Picture'
        }, { quoted: message });
    } catch {
        await sock.sendMessage(chatId, { text: '❌ Could not fetch group profile picture.' }, { quoted: message });
    }
}

// ── .getpp (get user profile picture) ────────────────────────────────────────
async function getPpCommand(sock, chatId, message) {
    const mentioned = getMentioned(message);
    const target = mentioned[0] || message.key.participant || message.key.remoteJid;
    try {
        const url = await sock.profilePictureUrl(target, 'image');
        await sock.sendMessage(chatId, {
            image: { url },
            caption: `📸 Profile picture of @${target.split('@')[0]}`,
            mentions: [target]
        }, { quoted: message });
    } catch {
        await sock.sendMessage(chatId, { text: '❌ Could not fetch profile picture (private or not set).' }, { quoted: message });
    }
}

// ── .togstatus (toggle group status open/closed) ─────────────────────────────
async function togStatusCommand(sock, chatId, senderId, message) {
    if (!chatId.endsWith('@g.us'))
        return sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: message });
    const admin = await isAdmin(sock, chatId, senderId);
    if (!admin)
        return sock.sendMessage(chatId, { text: '❌ Admins only.' }, { quoted: message });

    const text = getText(message).toLowerCase();
    const setting = text.includes('open') ? 'all_member_add' : 'admin_add';
    try {
        await sock.groupSettingUpdate(chatId, setting);
        await sock.sendMessage(chatId, {
            text: `✅ Group join setting: *${setting === 'all_member_add' ? 'Open (anyone can add)' : 'Closed (admin only)'}*`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}` }, { quoted: message });
    }
}

// ── .getparticipants ──────────────────────────────────────────────────────────
async function getParticipantsCommand(sock, chatId, message) {
    if (!chatId.endsWith('@g.us'))
        return sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: message });

    const meta = await sock.groupMetadata(chatId);
    const members = meta.participants;
    const admins = members.filter(p => p.isAdmin || p.isSuperAdmin);
    const regular = members.filter(p => !p.isAdmin && !p.isSuperAdmin);

    let text = `👥 *Group Participants (${members.length})*\n\n`;
    text += `👮 *Admins (${admins.length}):*\n`;
    admins.forEach((p, i) => { text += `  ${i + 1}. ${p.id.split('@')[0]}${p.isSuperAdmin ? ' 👑' : ''}\n`; });
    text += `\n👤 *Members (${regular.length}):*\n`;
    regular.slice(0, 30).forEach((p, i) => { text += `  ${i + 1}. ${p.id.split('@')[0]}\n`; });
    if (regular.length > 30) text += `  ... and ${regular.length - 30} more`;

    await sock.sendMessage(chatId, { text }, { quoted: message });
}

// ── .listonline (approximate — lists all members, WA doesn't expose online status via API) ──
async function listOnlineCommand(sock, chatId, message) {
    if (!chatId.endsWith('@g.us'))
        return sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: message });

    await sock.sendMessage(chatId, {
        text: `ℹ️ *Note:* WhatsApp's API does not allow bots to see who is online.\n\nUse .getparticipants to see all group members instead.`
    }, { quoted: message });
}

// ── .listinactive (members with 0 messages in count file) ────────────────────
async function listInactiveCommand(sock, chatId, message) {
    if (!chatId.endsWith('@g.us'))
        return sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: message });

    const meta = await sock.groupMetadata(chatId);
    const allMembers = meta.participants.map(p => p.id);

    let counts = {};
    try {
        const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'messageCount.json')));
        counts = raw[chatId] || {};
    } catch {}

    const inactive = allMembers.filter(jid => !counts[jid] || counts[jid] === 0);
    if (!inactive.length)
        return sock.sendMessage(chatId, { text: '✅ No inactive members found (or message tracking just started).' }, { quoted: message });

    let text = `💤 *Inactive Members (${inactive.length}):*\n`;
    inactive.slice(0, 50).forEach((jid, i) => { text += `${i + 1}. @${jid.split('@')[0]}\n`; });
    if (inactive.length > 50) text += `...and ${inactive.length - 50} more`;

    await sock.sendMessage(chatId, { text, mentions: inactive.slice(0, 50) }, { quoted: message });
}

// ── .approveall ───────────────────────────────────────────────────────────────
async function approveAllCommand(sock, chatId, senderId, message) {
    if (!chatId.endsWith('@g.us'))
        return sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: message });
    const admin = await isAdmin(sock, chatId, senderId);
    if (!admin)
        return sock.sendMessage(chatId, { text: '❌ Admins only.' }, { quoted: message });

    try {
        // approve all pending join requests
        await sock.groupRequestParticipantsUpdate(chatId, [], 'approve');
        await sock.sendMessage(chatId, { text: '✅ All pending join requests approved.' }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ ${e.message}` }, { quoted: message });
    }
}

// ── .rejectall ────────────────────────────────────────────────────────────────
async function rejectAllCommand(sock, chatId, senderId, message) {
    if (!chatId.endsWith('@g.us'))
        return sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: message });
    const admin = await isAdmin(sock, chatId, senderId);
    if (!admin)
        return sock.sendMessage(chatId, { text: '❌ Admins only.' }, { quoted: message });

    try {
        await sock.groupRequestParticipantsUpdate(chatId, [], 'reject');
        await sock.sendMessage(chatId, { text: '✅ All pending join requests rejected.' }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ ${e.message}` }, { quoted: message });
    }
}

// ── .stickerpack ──────────────────────────────────────────────────────────────
async function stickerPackCommand(sock, chatId, message) {
    const settings = require('../settings');
    await sock.sendMessage(chatId, {
        text: `📦 *Sticker Pack Info*\n\n🏷 Pack: ${settings.packname || 'LordFarhan Bot'}\n👤 Author: ${settings.author || 'DarkLord Farhan'}\n\nSend any image/video with .sticker to create a sticker!`
    }, { quoted: message });
}

// ── .disp (display group settings) ───────────────────────────────────────────
async function dispCommand(sock, chatId, message) {
    if (!chatId.endsWith('@g.us'))
        return sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: message });

    const meta = await sock.groupMetadata(chatId);
    const restrict = meta.announce ? '🔒 Admins only' : '🌐 All members';
    const locked = meta.restrict ? '🔒 Admins only' : '🌐 All members';

    await sock.sendMessage(chatId, {
        text: `⚙️ *Group Settings*\n\n📝 Name: ${meta.subject}\n👥 Members: ${meta.participants.length}\n✉️ Send messages: ${restrict}\n✏️ Edit info: ${locked}\n🆔 JID: ${chatId}`
    }, { quoted: message });
}

// ── .fangtrace (trace who forwarded bot message) ──────────────────────────────
async function fangtraceCommand(sock, chatId, message) {
    const ctx = message.message?.extendedTextMessage?.contextInfo;
    if (!ctx?.quotedMessage)
        return sock.sendMessage(chatId, { text: 'Reply to a forwarded message to trace it.\nUsage: Reply + .fangtrace' }, { quoted: message });

    const fwdScore = ctx.quotedMessage?.conversation || ctx.quotedMessage?.extendedTextMessage;
    const sender = ctx.participant || ctx.remoteJid || 'Unknown';
    await sock.sendMessage(chatId, {
        text: `🔎 *Fangtrace Result*\n\nOriginal sender: @${sender.split('@')[0]}\nForwarded by: @${(message.key.participant || message.key.remoteJid || '').split('@')[0]}`,
        mentions: [sender, message.key.participant || message.key.remoteJid].filter(Boolean)
    }, { quoted: message });
}

module.exports = {
    addCommand, promoteAllCommand, demoteAllCommand, kickAllCommand,
    exCommand, clearBanListCommand, resetWarnCommand, setWarnCommand,
    gctimeCommand, antileaveCommand, addBadwordCommand, removeBadwordCommand,
    listBadwordCommand, leaveCommand, createGroupCommand, groupLinkCommand,
    tagAdminCommand, getGppCommand, getPpCommand, togStatusCommand,
    getParticipantsCommand, listOnlineCommand, listInactiveCommand,
    approveAllCommand, rejectAllCommand, stickerPackCommand, dispCommand,
    fangtraceCommand,
    loadAntileave, loadBadwords,
};
