'use strict';
/**
 * Fun Commands 2:
 * bf, gf, couple, gay, device, movie, trailer, readsite,
 * goodmorning, channelstatus, hack (fake), genmusic, genlyrics
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

function getText(m) {
    return (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
}
function getArg(m, cmd) {
    return getText(m).replace(new RegExp(`^\\.${cmd}\\s*`, 'i'), '').trim();
}
function getMentioned(m) {
    return m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
}

// ── .bf / .gf (couple name generator) ────────────────────────────────────────
async function bfCommand(sock, chatId, message) {
    const meta = await sock.groupMetadata(chatId).catch(() => null);
    const members = meta?.participants || [];
    if (members.length < 2) return sock.sendMessage(chatId, { text: '❤️ Need at least 2 group members for this!' }, { quoted: message });
    const rand = members[Math.floor(Math.random() * members.length)];
    const you = message.key.participant || message.key.remoteJid;
    await sock.sendMessage(chatId, {
        text: `💑 *Boyfriend Generator*\n\nYour BF: @${rand.id.split('@')[0]}\n\n❤️ You two are meant to be!`,
        mentions: [rand.id]
    }, { quoted: message });
}

async function gfCommand(sock, chatId, message) {
    const meta = await sock.groupMetadata(chatId).catch(() => null);
    const members = meta?.participants || [];
    if (members.length < 2) return sock.sendMessage(chatId, { text: '💕 Need at least 2 group members for this!' }, { quoted: message });
    const rand = members[Math.floor(Math.random() * members.length)];
    await sock.sendMessage(chatId, {
        text: `💑 *Girlfriend Generator*\n\nYour GF: @${rand.id.split('@')[0]}\n\n💕 You two are meant to be!`,
        mentions: [rand.id]
    }, { quoted: message });
}

// ── .couple ───────────────────────────────────────────────────────────────────
async function coupleCommand(sock, chatId, message) {
    const meta = await sock.groupMetadata(chatId).catch(() => null);
    const members = meta?.participants || [];
    if (members.length < 2) return sock.sendMessage(chatId, { text: '💑 Need at least 2 members!' }, { quoted: message });
    const shuffled = [...members].sort(() => Math.random() - 0.5);
    const p1 = shuffled[0], p2 = shuffled[1];
    const compat = Math.floor(Math.random() * 41) + 60;
    const hearts = ['❤️', '💕', '💖', '💗', '💓', '💞'];
    const heart = hearts[Math.floor(Math.random() * hearts.length)];
    await sock.sendMessage(chatId, {
        text: `${heart} *Couple of the Day!*\n\n👫 @${p1.id.split('@')[0]} + @${p2.id.split('@')[0]}\n\n💯 Compatibility: ${compat}%\n${heart.repeat(Math.floor(compat / 10))}`,
        mentions: [p1.id, p2.id]
    }, { quoted: message });
}

// ── .gay ──────────────────────────────────────────────────────────────────────
async function gayCommand(sock, chatId, message) {
    const mentioned = getMentioned(message);
    const target = mentioned[0] || message.key.participant || message.key.remoteJid;
    const pct = Math.floor(Math.random() * 101);
    const bar = '🌈'.repeat(Math.floor(pct / 10)) + '⬜'.repeat(10 - Math.floor(pct / 10));
    await sock.sendMessage(chatId, {
        text: `🌈 *Gay Meter*\n\n@${target.split('@')[0]}\n\n${bar}\n${pct}% 🌈`,
        mentions: [target]
    }, { quoted: message });
}

// ── .device ───────────────────────────────────────────────────────────────────
async function deviceCommand(sock, chatId, message) {
    const mentioned = getMentioned(message);
    const target = mentioned[0] || message.key.participant || message.key.remoteJid;
    // Get device from key type (rough detection)
    const keyId = message.key.id || '';
    const agentType = message.key.participant ? 'Mobile' : 'Web';
    const devices = ['iPhone', 'Samsung Galaxy', 'Android', 'WhatsApp Web', 'WhatsApp Desktop', 'Pixel'];
    const device = devices[Math.floor(Math.random() * devices.length)];
    await sock.sendMessage(chatId, {
        text: `📱 *Device Detector*\n\n👤 @${target.split('@')[0]}\n📱 Device: ${device}\n💻 Platform: ${agentType}\n🔑 Key: ${keyId.slice(0, 10)}…`,
        mentions: [target]
    }, { quoted: message });
}

// ── .movie ────────────────────────────────────────────────────────────────────
async function movieCommand(sock, chatId, message) {
    const title = getArg(message, 'movie');
    if (!title) return sock.sendMessage(chatId, { text: 'Usage: .movie <title>\nExample: .movie Avengers' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '🎬 Searching movie…' }, { quoted: message });
    try {
        const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(title)}`);
        const d = (await res.json())?.[0]?.show;
        if (!d?.name) throw new Error('Not found');
        const text = `🎬 *${d.name}* (${d.premiered?.slice(0, 4) || 'N/A'})\n\n⭐ Rating: ${d.rating?.average || 'N/A'}/10\n🏆 Genre: ${(d.genres || []).join(', ') || 'N/A'}\n🌍 Country: ${d.network?.country?.name || d.webChannel?.country?.name || 'N/A'}\n📝 Plot: ${(d.summary || 'No plot available').replace(/<[^>]+>/g, '').slice(0, 300)}`;
        if (d.image?.medium) {
            try {
                await sock.sendMessage(chatId, { image: { url: d.image.medium }, caption: text }, { quoted: message });
                return;
            } catch {}
        }
        await sock.sendMessage(chatId, { text }, { quoted: message });
    } catch {
        await sock.sendMessage(chatId, { text: `❌ Movie "*${title}*" not found.` }, { quoted: message });
    }
}

// ── .trailer ──────────────────────────────────────────────────────────────────
async function trailerCommand(sock, chatId, message) {
    const title = getArg(message, 'trailer');
    if (!title) return sock.sendMessage(chatId, { text: 'Usage: .trailer <movie title>' }, { quoted: message });
    const query = encodeURIComponent(title + ' official trailer');
    await sock.sendMessage(chatId, {
        text: `🎬 *${title} Trailer*\n\n🔗 https://www.youtube.com/results?search_query=${query}`
    }, { quoted: message });
}

// ── .readsite ─────────────────────────────────────────────────────────────────
async function readSiteCommand(sock, chatId, message) {
    const url = getArg(message, 'readsite');
    if (!url || !url.startsWith('http')) return sock.sendMessage(chatId, { text: 'Usage: .readsite <url>' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '📖 Reading site…' }, { quoted: message });
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
        let text = await res.text();
        text = text
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 1500);
        await sock.sendMessage(chatId, {
            text: `📖 *${url}*\n\n${text}${text.length >= 1500 ? '…' : ''}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Could not read site: ${e.message}` }, { quoted: message });
    }
}

// ── .goodmorning ─────────────────────────────────────────────────────────────
async function goodMorningCommand(sock, chatId, message) {
    const greetings = [
        '🌅 *Good Morning!*\n\nRise and shine! A new day full of possibilities awaits you. 🌻\n\n_"Each morning we are born again. What we do today matters most."_',
        '☀️ *Good Morning!*\n\nWishing you a bright and beautiful day ahead! ☀️\n\n_"Morning is an important time of day, because how you spend your morning can often tell you what kind of day you are going to have."_',
        '🌸 *Good Morning!*\n\nStart your day with a smile! You\'ve got this 💪\n\n_"Every morning is a chance at a new day."_',
        '🌄 *Good Morning!*\n\nMay your day be as amazing as you are! ✨\n\n_"An early morning walk is a blessing for the whole day."_',
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
    if (fs.existsSync(imagePath)) {
        try {
            await sock.sendMessage(chatId, { image: fs.readFileSync(imagePath), caption: greeting }, { quoted: message });
            return;
        } catch {}
    }
    await sock.sendMessage(chatId, { text: greeting }, { quoted: message });
}

// ── .channelstatus ────────────────────────────────────────────────────────────
async function channelStatusCommand(sock, chatId, message) {
    const channelId = global._botChannel;
    if (!channelId) {
        return sock.sendMessage(chatId, {
            text: '📢 *Channel Status*\n\nNo channel configured.\nUse .setchannel <jid> to set one.'
        }, { quoted: message });
    }
    await sock.sendMessage(chatId, {
        text: `📢 *Channel Status*\n\n✅ Channel configured: ${channelId}\n📡 Bot is monitoring this channel.`
    }, { quoted: message });
}

// ── .hack (fun fake hack animation) ──────────────────────────────────────────
async function hackCommand(sock, chatId, message) {
    const mentioned = getMentioned(message);
    const target = mentioned[0] || message.key.participant || message.key.remoteJid;
    const name = target.split('@')[0];

    const stages = [
        `💻 *[HACKING INITIATED]*\n\nTarget: @${name}\n\n[▓░░░░░░░░░] 10% — Scanning ports...`,
        `💻 *[HACKING IN PROGRESS]*\n\nTarget: @${name}\n\n[▓▓▓▓░░░░░░] 40% — Bypassing firewall...`,
        `💻 *[HACKING IN PROGRESS]*\n\nTarget: @${name}\n\n[▓▓▓▓▓▓▓░░░] 70% — Extracting data...`,
        `💻 *[HACK COMPLETE]*\n\nTarget: @${name}\n\n[▓▓▓▓▓▓▓▓▓▓] 100% ✅\n\n📋 Data found:\n• Name: ${name}\n• Status: 😂 Totally hacked (jk!)\n• Favorite food: Whatever you last ate\n\n⚠️ _This is just for fun! Real hacking is illegal._`
    ];

    let msg = await sock.sendMessage(chatId, { text: stages[0], mentions: [target] }, { quoted: message });
    for (let i = 1; i < stages.length; i++) {
        await new Promise(r => setTimeout(r, 1500));
        await sock.sendMessage(chatId, { text: stages[i], mentions: [target] }, { edit: msg?.key });
    }
}

// ── .genmusic ─────────────────────────────────────────────────────────────────
async function genMusicCommand(sock, chatId, message) {
    const prompt = getArg(message, 'genmusic');
    if (!prompt) return sock.sendMessage(chatId, { text: 'Usage: .genmusic <music description>\nExample: .genmusic upbeat afrobeats song about love' }, { quoted: message });
    await sock.sendMessage(chatId, {
        text: `🎵 *Music Generation*\n\nPrompt: "${prompt}"\n\n🔗 Generate your music at:\n• https://suno.ai\n• https://udio.com\n• https://www.aiva.ai\n\n_AI music generation requires a dedicated service API key._`
    }, { quoted: message });
}

// ── .genlyrics ────────────────────────────────────────────────────────────────
async function genLyricsCommand(sock, chatId, message) {
    const topic = getArg(message, 'genlyrics');
    if (!topic) return sock.sendMessage(chatId, { text: 'Usage: .genlyrics <topic>\nExample: .genlyrics love and heartbreak' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '🎤 Writing lyrics…' }, { quoted: message });
    try {
        const res = await fetch('https://api.xteam.xyz/gpt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: `Write creative song lyrics about "${topic}". Include a verse, chorus, and bridge. Make it catchy and rhythmic.`,
                apikey: global.APIKeys?.['https://api.xteam.xyz'] || 'd90a9e986e18778b'
            }),
            timeout: 20000
        });
        const d = await res.json();
        const lyrics = d.result || d.answer || d.message || d.response;
        if (lyrics) {
            await sock.sendMessage(chatId, { text: `🎤 *Lyrics: ${topic}*\n\n${lyrics}` }, { quoted: message });
        } else throw new Error('No lyrics');
    } catch {
        // Simple fallback lyrics
        await sock.sendMessage(chatId, {
            text: `🎤 *Lyrics: ${topic}*\n\n[Verse 1]\nEvery day I wake up thinking about ${topic}\nIt fills my heart with something I can't ignore\nThe world keeps spinning round and round\nBut ${topic} keeps me on solid ground\n\n[Chorus]\nOh ${topic}, you mean everything to me\nYou set my soul and spirit free\nWith you by my side I'll always be\nLiving life as it was meant to be\n\n[Bridge]\nDon't let go, don't fade away\n${topic} is here to stay\n\n🎵 _Generated by LordFarhan Bot_`
        }, { quoted: message });
    }
}

module.exports = {
    bfCommand, gfCommand, coupleCommand, gayCommand, deviceCommand,
    movieCommand, trailerCommand, readSiteCommand, goodMorningCommand,
    channelStatusCommand, hackCommand, genMusicCommand, genLyricsCommand,
};
