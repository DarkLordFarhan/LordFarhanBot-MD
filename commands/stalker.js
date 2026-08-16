'use strict';
/**
 * Stalker Commands:
 * wachannel, twitterstalk, ipstalk, npmstalk, stalkermenu
 */

const fetch = require('node-fetch');

function getText(m) {
    return (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
}
function getArg(m, cmd) {
    return getText(m).replace(new RegExp(`^\\.${cmd}\\s*`, 'i'), '').trim();
}

// ── WhatsApp Channel Stalk ────────────────────────────────────────────────────
async function waChannelCommand(sock, chatId, message) {
    const handle = getArg(message, 'wachannel').replace('@', '');
    if (!handle)
        return sock.sendMessage(chatId, { text: 'Usage: .wachannel <channel-handle>\nExample: .wachannel nasa' }, { quoted: message });

    await sock.sendMessage(chatId, { text: `🔍 Searching WhatsApp Channel: @${handle}...` }, { quoted: message });
    try {
        const results = await sock.newsletterSearch(handle, 5).catch(() => null);
        if (!results || !results.length) {
            return sock.sendMessage(chatId, {
                text: `📢 *WhatsApp Channel: @${handle}*\n\n❓ Channel not found or not public.\n\nTip: Search manually in WhatsApp > Updates > Find channels`
            }, { quoted: message });
        }
        const ch = results[0];
        await sock.sendMessage(chatId, {
            text: `📢 *WhatsApp Channel*\n\n📛 Name: ${ch.name || handle}\n👥 Subscribers: ${ch.subscriberCount || 'N/A'}\n📝 Description: ${ch.description || 'N/A'}\n🔗 ID: ${ch.id || 'N/A'}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, {
            text: `📢 *WhatsApp Channel: @${handle}*\n\nℹ️ Search via bot is limited. Open WhatsApp > Updates > Find channels > search "${handle}"`
        }, { quoted: message });
    }
}

// ── Twitter/X Stalk ───────────────────────────────────────────────────────────
async function twitterStalkCommand(sock, chatId, message) {
    const username = getArg(message, 'twitterstalk').replace('@', '');
    if (!username)
        return sock.sendMessage(chatId, { text: 'Usage: .twitterstalk <username>' }, { quoted: message });

    await sock.sendMessage(chatId, { text: `🔍 Fetching Twitter/X profile: @${username}...` }, { quoted: message });
    try {
        // Use nitter.net public API (no auth needed)
        const res = await fetch(`https://nitter.privacydev.net/${encodeURIComponent(username)}/rss`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 12000
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const xml = await res.text();

        // Parse RSS
        const name = (xml.match(/<title>(.*?) \/ nitter<\/title>/) || [])[1]?.trim() || username;
        const bio = (xml.match(/<description>(.*?)<\/description>/) || [])[1]?.trim() || 'N/A';
        const img = (xml.match(/<url>(https?:\/\/[^<]+)<\/url>/) || [])[1] || null;
        const postCount = (xml.match(/<item>/g) || []).length;

        const result = `🐦 *TWITTER/X PROFILE*\n${'─'.repeat(28)}\n👤 Username: @${username}\n📝 Name: ${name}\n📖 Bio: ${bio.slice(0, 200)}\n📷 Recent posts: ${postCount}\n🔗 Profile: https://x.com/${username}\n${'─'.repeat(28)}\n> 🤖 _🌑༒𓆩『𝕃𝕆ℝ𝔻 𝔽𝔸ℝℍ𝔸ℕ 𝕄𝔻』𓆪༒☠️_`;

        if (img) {
            try {
                await sock.sendMessage(chatId, { image: { url: img }, caption: result }, { quoted: message });
                return;
            } catch {}
        }
        await sock.sendMessage(chatId, { text: result }, { quoted: message });
    } catch (e) {
        // Final fallback: direct link
        await sock.sendMessage(chatId, {
            text: `🐦 *Twitter/X Profile: @${username}*\n\n🔗 https://x.com/${username}\n🔗 https://nitter.privacydev.net/${username}\n\n_Detailed data requires Twitter API key._`
        }, { quoted: message });
    }
}

// ── IP Stalk ──────────────────────────────────────────────────────────────────
async function ipStalkCommand(sock, chatId, message) {
    const ip = getArg(message, 'ipstalk');
    if (!ip)
        return sock.sendMessage(chatId, { text: 'Usage: .ipstalk <ip address>' }, { quoted: message });

    await sock.sendMessage(chatId, { text: `🔍 Gathering info on IP: ${ip}...` }, { quoted: message });
    try {
        const [geoRes, abuseRes] = await Promise.allSettled([
            fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`).then(r => r.json()),
            fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`, {
                headers: { Key: 'dummy', Accept: 'application/json' }
            }).then(r => r.json()).catch(() => null)
        ]);

        const geo = geoRes.status === 'fulfilled' ? geoRes.value : {};
        if (geo.error) throw new Error(geo.reason || 'IP not found');

        await sock.sendMessage(chatId, {
            text: `🕵️ *IP STALK: ${ip}*\n${'─'.repeat(28)}\n🌍 Country: ${geo.country_name || 'N/A'} (${geo.country_code || '?'})\n🏙 City: ${geo.city || 'N/A'}\n🗺 Region: ${geo.region || 'N/A'}\n📮 Postal: ${geo.postal || 'N/A'}\n🌐 ISP/Org: ${geo.org || 'N/A'}\n⏰ Timezone: ${geo.timezone || 'N/A'}\n📍 Lat: ${geo.latitude || 'N/A'}, Lon: ${geo.longitude || 'N/A'}\n🔢 AS Number: ${geo.asn || 'N/A'}\n${'─'.repeat(28)}\n> 🤖 _🌑༒𓆩『𝕃𝕆ℝ𝔻 𝔽𝔸ℝℍ𝔸ℕ 𝕄𝔻』𓆪༒☠️_`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ IP stalk failed: ${e.message}` }, { quoted: message });
    }
}

// ── NPM Stalk ─────────────────────────────────────────────────────────────────
async function npmStalkCommand(sock, chatId, message) {
    const pkg = getArg(message, 'npmstalk');
    if (!pkg)
        return sock.sendMessage(chatId, { text: 'Usage: .npmstalk <package-name>\nExample: .npmstalk express' }, { quoted: message });

    await sock.sendMessage(chatId, { text: `🔍 Fetching npm package: ${pkg}...` }, { quoted: message });
    try {
        const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`);
        if (!res.ok) throw new Error(`Package not found (${res.status})`);
        const d = await res.json();

        const latest = d['dist-tags']?.latest || Object.keys(d.versions || {}).pop();
        const ver = d.versions?.[latest] || {};
        const downloads = await fetch(`https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(pkg)}`)
            .then(r => r.json()).then(r => r.downloads || 'N/A').catch(() => 'N/A');

        const numFmt = n => typeof n === 'number' ? n.toLocaleString() : n;

        await sock.sendMessage(chatId, {
            text: `📦 *NPM PACKAGE: ${d.name}*\n${'─'.repeat(28)}\n📝 Description: ${d.description || 'N/A'}\n🏷 Latest: v${latest}\n👤 Author: ${typeof d.author === 'string' ? d.author : d.author?.name || 'N/A'}\n📥 Monthly downloads: ${numFmt(downloads)}\n📅 Created: ${new Date(d.time?.created).toDateString()}\n🔄 Updated: ${new Date(d.time?.modified).toDateString()}\n🔗 Repo: ${ver?.repository?.url || d.homepage || 'N/A'}\n📜 License: ${ver?.license || d.license || 'N/A'}\n🌐 Homepage: ${d.homepage || 'N/A'}\n\n🔗 https://npmjs.com/package/${d.name}\n${'─'.repeat(28)}\n> 🤖 _🌑༒𓆩『𝕃𝕆ℝ𝔻 𝔽𝔸ℝℍ𝔸ℕ 𝕄𝔻』𓆪༒☠️_`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ NPM stalk failed: ${e.message}` }, { quoted: message });
    }
}

// ── Stalker Menu ──────────────────────────────────────────────────────────────
async function stalkerMenuCommand(sock, chatId, message) {
    await sock.sendMessage(chatId, {
        text: `🕵️ *STALKER MENU*\n\n${'─'.repeat(28)}\n\n🐦 *.twitterstalk* <username>\n   Fetch Twitter/X profile info\n\n📸 *.igstalk* <username>\n   Fetch Instagram profile info\n\n🎵 *.tiktokstalk* <username>\n   Fetch TikTok profile info\n\n💻 *.gitstalk* <username>\n   Fetch GitHub profile info\n\n📦 *.npmstalk* <package>\n   Fetch NPM package info\n\n📢 *.wachannel* <handle>\n   Search WhatsApp channel\n\n🌐 *.ipstalk* <ip>\n   Get IP address details\n\n${'─'.repeat(28)}\n> 🤖 _🌑༒𓆩『𝕃𝕆ℝ𝔻 𝔽𝔸ℝℍ𝔸ℕ 𝕄𝔻』𓆪༒☠️_`
    }, { quoted: message });
}

module.exports = {
    waChannelCommand, twitterStalkCommand, ipStalkCommand,
    npmStalkCommand, stalkerMenuCommand,
};
