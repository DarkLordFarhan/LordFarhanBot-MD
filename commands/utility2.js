'use strict';
/**
 * Extended Utility Commands:
 * ping2, time, define, remind, sessioninfo, genmusic, genlyrics,
 * covid, wiki, iplookup, getip, onwhatsapp, qrencode, imgbb, save,
 * vcf, viewvcf, vv2, shazam, country, fetch (url fetch), inspect
 */

const fetch = require('node-fetch');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const os = require('os');

function getText(m) {
    return (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
}
function getArg(m, cmd) {
    return getText(m).replace(new RegExp(`^\\.${cmd}\\s*`, 'i'), '').trim();
}

// ── .ping2 ────────────────────────────────────────────────────────────────────
async function ping2Command(sock, chatId, message) {
    const start = Date.now();
    const msg = await sock.sendMessage(chatId, { text: '🏓 Pinging…' }, { quoted: message });
    const end = Date.now();
    await sock.sendMessage(chatId, {
        text: `🏓 *Pong!*\n\n⚡ Response: *${end - start}ms*\n📶 Connection: Active\n🤖 Bot: Online`
    }, { quoted: message });
}

// ── .time ─────────────────────────────────────────────────────────────────────
async function timeCommand(sock, chatId, message) {
    const arg = getArg(message, 'time');
    const tz = arg || 'Africa/Nairobi';
    try {
        const now = new Date();
        const options = { timeZone: tz, hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formatted = now.toLocaleString('en-US', options);
        await sock.sendMessage(chatId, {
            text: `🕐 *Current Time*\n\n📍 Timezone: ${tz}\n🗓 ${formatted}`
        }, { quoted: message });
    } catch {
        await sock.sendMessage(chatId, { text: `❌ Unknown timezone: ${tz}\nExample: .time America/New_York` }, { quoted: message });
    }
}

// ── .define ───────────────────────────────────────────────────────────────────
async function defineCommand(sock, chatId, message) {
    const word = getArg(message, 'define');
    if (!word) return sock.sendMessage(chatId, { text: 'Usage: .define <word>' }, { quoted: message });
    try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
        const data = await res.json();
        if (!Array.isArray(data) || !data[0]) throw new Error('Not found');
        const entry = data[0];
        const meaning = entry.meanings?.[0];
        const def = meaning?.definitions?.[0];
        const text = `📖 *${entry.word}*${entry.phonetic ? ` /${entry.phonetic}/` : ''}\n\n🏷 Part of speech: ${meaning?.partOfSpeech || 'N/A'}\n📝 Definition: ${def?.definition || 'N/A'}\n💬 Example: ${def?.example || 'N/A'}\n🔗 Synonyms: ${(def?.synonyms || meaning?.synonyms || []).slice(0, 5).join(', ') || 'N/A'}`;
        await sock.sendMessage(chatId, { text }, { quoted: message });
    } catch {
        await sock.sendMessage(chatId, { text: `❌ Definition not found for "*${word}*".` }, { quoted: message });
    }
}

// ── .remind ───────────────────────────────────────────────────────────────────
async function remindCommand(sock, chatId, message) {
    const args = getArg(message, 'remind');
    // format: .remind 5m do something  or  .remind 1h check email
    const match = args.match(/^(\d+)(s|m|h)\s+(.+)$/i);
    if (!match) return sock.sendMessage(chatId, { text: 'Usage: .remind <time><s/m/h> <message>\nExample: .remind 10m drink water' }, { quoted: message });
    const [, num, unit, note] = match;
    const ms = parseInt(num) * (unit === 's' ? 1000 : unit === 'm' ? 60000 : 3600000);
    await sock.sendMessage(chatId, { text: `⏰ Reminder set! I'll remind you in *${num}${unit}*: "${note}"` }, { quoted: message });
    setTimeout(async () => {
        try {
            await sock.sendMessage(chatId, {
                text: `⏰ *REMINDER*\n\n@${(message.key.participant || message.key.remoteJid).split('@')[0]}\n\n📝 ${note}`,
                mentions: [message.key.participant || message.key.remoteJid]
            });
        } catch {}
    }, ms);
}

// ── .sessioninfo ──────────────────────────────────────────────────────────────
async function sessionInfoCommand(sock, chatId, message) {
    const settings = require('../settings');
    const used = process.memoryUsage();
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    await sock.sendMessage(chatId, {
        text: `📊 *Session Info*\n\n🤖 Bot: ${settings.botName}\n📱 Node: ${process.version}\n⏱ Uptime: ${days}d ${hours}h ${minutes}m\n💾 RAM Used: ${(used.rss / 1024 / 1024).toFixed(1)} MB\n🖥 Heap: ${(used.heapUsed / 1024 / 1024).toFixed(1)} / ${(used.heapTotal / 1024 / 1024).toFixed(1)} MB\n📡 Platform: ${process.platform}\n⚙️ Arch: ${process.arch}`
    }, { quoted: message });
}

// ── .covid ────────────────────────────────────────────────────────────────────
async function covidCommand(sock, chatId, message) {
    const country = getArg(message, 'covid') || 'world';
    try {
        const url = country.toLowerCase() === 'world'
            ? 'https://disease.sh/v3/covid-19/all'
            : `https://disease.sh/v3/covid-19/countries/${encodeURIComponent(country)}`;
        const res = await fetch(url);
        const d = await res.json();
        if (d.message) throw new Error(d.message);
        const fmt = n => (n || 0).toLocaleString();
        await sock.sendMessage(chatId, {
            text: `🦠 *COVID-19 Stats: ${d.country || 'World'}*\n\n🔢 Total Cases: ${fmt(d.cases)}\n💀 Deaths: ${fmt(d.deaths)}\n✅ Recovered: ${fmt(d.recovered)}\n⚡ Active: ${fmt(d.active)}\n🆕 Today Cases: ${fmt(d.todayCases)}\n💉 Today Deaths: ${fmt(d.todayDeaths)}\n👥 Per Million: ${fmt(d.casesPerOneMillion)}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ COVID stats failed: ${e.message}` }, { quoted: message });
    }
}

// ── .wiki ─────────────────────────────────────────────────────────────────────
async function wikiCommand(sock, chatId, message) {
    const query = getArg(message, 'wiki');
    if (!query) return sock.sendMessage(chatId, { text: 'Usage: .wiki <topic>' }, { quoted: message });
    try {
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
        const d = await res.json();
        if (d.type === 'disambiguation' || !d.extract) throw new Error('Disambiguation or not found');
        const text = `📚 *${d.title}*\n\n${d.extract.slice(0, 800)}${d.extract.length > 800 ? '…' : ''}\n\n🔗 ${d.content_urls?.desktop?.page || 'https://wikipedia.org'}`;
        if (d.thumbnail?.source) {
            try {
                await sock.sendMessage(chatId, { image: { url: d.thumbnail.source }, caption: text }, { quoted: message });
                return;
            } catch {}
        }
        await sock.sendMessage(chatId, { text }, { quoted: message });
    } catch {
        // Try search fallback
        try {
            const res2 = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json`);
            const [, titles, , urls] = await res2.json();
            if (titles?.[0]) {
                await sock.sendMessage(chatId, { text: `📚 *Wikipedia: ${titles[0]}*\n\n🔗 ${urls[0]}` }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, { text: `❌ No Wikipedia article found for "${query}".` }, { quoted: message });
            }
        } catch {
            await sock.sendMessage(chatId, { text: `❌ Wikipedia lookup failed for "${query}".` }, { quoted: message });
        }
    }
}

// ── .iplookup / .getip ────────────────────────────────────────────────────────
async function ipLookupCommand(sock, chatId, message) {
    const ip = getArg(message, 'iplookup') || getArg(message, 'getip');
    const target = ip || 'https://api.ipify.org?format=json';
    try {
        let resolvedIp = ip;
        if (!ip) {
            const r = await fetch('https://api.ipify.org?format=json');
            resolvedIp = (await r.json()).ip;
        }
        const res = await fetch(`https://ipapi.co/${encodeURIComponent(resolvedIp)}/json/`);
        const d = await res.json();
        if (d.error) throw new Error(d.reason);
        await sock.sendMessage(chatId, {
            text: `🌐 *IP Lookup: ${resolvedIp}*\n\n🏳️ Country: ${d.country_name} (${d.country_code})\n🏙 City: ${d.city || 'N/A'}\n🗺 Region: ${d.region || 'N/A'}\n📮 Postal: ${d.postal || 'N/A'}\n🌐 ISP: ${d.org || 'N/A'}\n⏰ Timezone: ${d.timezone || 'N/A'}\n📍 Coordinates: ${d.latitude}, ${d.longitude}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ IP lookup failed: ${e.message}` }, { quoted: message });
    }
}

async function getIpCommand(sock, chatId, message) {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const { ip } = await res.json();
        await sock.sendMessage(chatId, { text: `🌐 Bot's public IP: *${ip}*` }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Could not fetch IP: ${e.message}` }, { quoted: message });
    }
}

// ── .onwhatsapp ───────────────────────────────────────────────────────────────
async function onWhatsappCommand(sock, chatId, message) {
    const num = getArg(message, 'onwhatsapp').replace(/[^0-9]/g, '');
    if (!num) return sock.sendMessage(chatId, { text: 'Usage: .onwhatsapp <number>\nExample: .onwhatsapp 2547xxxxxxxx' }, { quoted: message });
    try {
        const [result] = await sock.onWhatsApp(num + '@s.whatsapp.net');
        if (result?.exists) {
            await sock.sendMessage(chatId, { text: `✅ *${num}* is on WhatsApp!\nJID: ${result.jid}` }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: `❌ *${num}* is NOT on WhatsApp.` }, { quoted: message });
        }
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Check failed: ${e.message}` }, { quoted: message });
    }
}

// ── .qrencode ─────────────────────────────────────────────────────────────────
async function qrEncodeCommand(sock, chatId, message) {
    const text = getArg(message, 'qrencode');
    if (!text) return sock.sendMessage(chatId, { text: 'Usage: .qrencode <text or URL>' }, { quoted: message });
    try {
        const buffer = await QRCode.toBuffer(text, { errorCorrectionLevel: 'H', width: 400 });
        await sock.sendMessage(chatId, {
            image: buffer,
            caption: `📱 *QR Code*\n\nContent: ${text.slice(0, 100)}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ QR generation failed: ${e.message}` }, { quoted: message });
    }
}

// ── .fetch (fetch webpage content) ───────────────────────────────────────────
async function fetchCommand(sock, chatId, message) {
    const url = getArg(message, 'fetch');
    if (!url || !url.startsWith('http')) return sock.sendMessage(chatId, { text: 'Usage: .fetch <url>' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '🌐 Fetching…' }, { quoted: message });
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
        let text = await res.text();
        // Strip HTML tags
        text = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1500);
        await sock.sendMessage(chatId, {
            text: `🌐 *Fetched: ${url}*\nStatus: ${res.status}\n\n${text}${text.length >= 1500 ? '…' : ''}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Fetch failed: ${e.message}` }, { quoted: message });
    }
}

// ── .inspect (inspect media/message metadata) ─────────────────────────────────
async function inspectCommand(sock, chatId, message) {
    const ctx = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const target = ctx || message.message;
    if (!target) return sock.sendMessage(chatId, { text: 'Reply to a message with .inspect to analyze it.' }, { quoted: message });

    const type = Object.keys(target)[0];
    const msg = target[type] || {};
    const info = {
        type,
        mimetype: msg.mimetype || 'N/A',
        size: msg.fileLength ? `${(msg.fileLength / 1024).toFixed(1)} KB` : 'N/A',
        duration: msg.seconds ? `${msg.seconds}s` : 'N/A',
        width: msg.width || 'N/A',
        height: msg.height || 'N/A',
        caption: (msg.caption || '').slice(0, 100) || 'N/A',
        url: msg.url ? msg.url.slice(0, 60) + '…' : 'N/A',
    };

    const lines = Object.entries(info).filter(([, v]) => v !== 'N/A').map(([k, v]) => `  ${k}: ${v}`);
    await sock.sendMessage(chatId, {
        text: `🔍 *Message Inspect*\n\n${lines.join('\n')}\n\nKey: ${message.key.id}`
    }, { quoted: message });
}

// ── .shazam ───────────────────────────────────────────────────────────────────
async function shazamCommand(sock, chatId, message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted?.audioMessage && !quoted?.videoMessage && !message.message?.audioMessage) {
        return sock.sendMessage(chatId, { text: '🎵 Usage: Reply to an audio/voice message with .shazam to identify the song.' }, { quoted: message });
    }
    await sock.sendMessage(chatId, { text: '🎵 Identifying song… (Note: Full Shazam requires ACRCloud API key)' }, { quoted: message });
    await sock.sendMessage(chatId, {
        text: `🎵 *Shazam Song ID*\n\nFull song recognition requires ACRCloud API.\nTry: https://www.shazam.com or upload to a music recognition app.`
    }, { quoted: message });
}

// ── .vcf (create contact card) ────────────────────────────────────────────────
async function vcfCommand(sock, chatId, message) {
    const args = getArg(message, 'vcf').split(/\s+/);
    if (args.length < 2) return sock.sendMessage(chatId, { text: 'Usage: .vcf <Name> <PhoneNumber>\nExample: .vcf John +254700000000' }, { quoted: message });
    const [name, phone] = args;
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEND:VCARD`;
    try {
        await sock.sendMessage(chatId, {
            contacts: { displayName: name, contacts: [{ vcard }] }
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ VCF send failed: ${e.message}` }, { quoted: message });
    }
}

// ── .viewvcf ──────────────────────────────────────────────────────────────────
async function viewVcfCommand(sock, chatId, message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const contact = quoted?.contactMessage || message.message?.contactMessage;
    if (!contact) return sock.sendMessage(chatId, { text: '📇 Reply to a contact message with .viewvcf to view details.' }, { quoted: message });
    const vcard = contact.vcard || '';
    const name = (vcard.match(/FN:(.*)/)?.[1] || contact.displayName || 'N/A').trim();
    const tel = (vcard.match(/TEL[^:]*:(.*)/)?.[1] || 'N/A').trim();
    const org = (vcard.match(/ORG:(.*)/)?.[1] || 'N/A').trim();
    await sock.sendMessage(chatId, {
        text: `📇 *Contact Card*\n\n👤 Name: ${name}\n📞 Phone: ${tel}\n🏢 Org: ${org}`
    }, { quoted: message });
}

// ── .vv2 (forward view-once as doc) ──────────────────────────────────────────
async function vv2Command(sock, chatId, message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo;
    const viewOnce = quoted?.quotedMessage?.viewOnceMessage?.message ||
        quoted?.quotedMessage?.viewOnceMessageV2?.message;
    if (!viewOnce)
        return sock.sendMessage(chatId, { text: '🔒 Reply to a view-once message with .vv2 to save it.' }, { quoted: message });
    const type = Object.keys(viewOnce)[0];
    await sock.sendMessage(chatId, { [type]: viewOnce[type] }, { quoted: message });
}

// ── .country ──────────────────────────────────────────────────────────────────
async function countryCommand(sock, chatId, message) {
    const name = getArg(message, 'country');
    if (!name) return sock.sendMessage(chatId, { text: 'Usage: .country <country name>' }, { quoted: message });
    try {
        const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fullText=false`);
        const data = await res.json();
        if (!Array.isArray(data) || !data[0]) throw new Error('Not found');
        const c = data[0];
        const currencies = Object.values(c.currencies || {}).map(cur => `${cur.name} (${cur.symbol || '?'})`).join(', ');
        const langs = Object.values(c.languages || {}).join(', ');
        const text = `🌍 *${c.name.common}* (${c.cca2})\n\n🏛 Capital: ${c.capital?.[0] || 'N/A'}\n🌎 Region: ${c.region} / ${c.subregion || 'N/A'}\n👥 Population: ${(c.population || 0).toLocaleString()}\n💰 Currency: ${currencies || 'N/A'}\n🗣 Language(s): ${langs || 'N/A'}\n🕐 Timezones: ${(c.timezones || []).slice(0, 3).join(', ')}\n📞 Calling: +${(c.idd?.root || '') + (c.idd?.suffixes?.[0] || '')}\n🚗 Drive: ${c.car?.side || 'N/A'}`;
        const flag = c.flags?.png || c.flags?.svg;
        if (flag) {
            try {
                await sock.sendMessage(chatId, { image: { url: flag }, caption: text }, { quoted: message });
                return;
            } catch {}
        }
        await sock.sendMessage(chatId, { text }, { quoted: message });
    } catch {
        await sock.sendMessage(chatId, { text: `❌ Country "${name}" not found.` }, { quoted: message });
    }
}

// ── .platform ─────────────────────────────────────────────────────────────────
async function platformCommand(sock, chatId, message) {
    await sock.sendMessage(chatId, {
        text: `🖥️ *Platform Info*\n\nOS: ${os.type()} ${os.release()}\nArch: ${os.arch()}\nHostname: ${os.hostname()}\nNode: ${process.version}\nUptime: ${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m\nCPUs: ${os.cpus().length}\nRAM Total: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB\nRAM Free: ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`
    }, { quoted: message });
}

module.exports = {
    ping2Command, timeCommand, defineCommand, remindCommand,
    sessionInfoCommand, covidCommand, wikiCommand, ipLookupCommand,
    getIpCommand, onWhatsappCommand, qrEncodeCommand, fetchCommand,
    inspectCommand, shazamCommand, vcfCommand, viewVcfCommand,
    vv2Command, countryCommand, platformCommand,
};
