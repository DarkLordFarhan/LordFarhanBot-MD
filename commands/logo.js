'use strict';
/**
 * Logo Design Studio Commands
 * Uses external logo/text effect APIs
 */

const fetch = require('node-fetch');

function getText(m) {
    return (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
}
function getArg(m, cmd) {
    return getText(m).replace(new RegExp(`^\\.${cmd}\\s*`, 'i'), '').trim();
}

// ephoto360 effect IDs used by the public ephoto wrappers.

// Logo effect data: [id/style, emoji, desc]
const LOGO_EFFECTS = {
    goldlogo:       [38, '🟡', 'Gold'],
    silverlogo:     [52, '⚪', 'Silver'],
    platinumlogo:   [52, '🔘', 'Platinum'],
    chromelogo:     [52, '💿', 'Chrome'],
    diamondlogo:    [55, '💎', 'Diamond'],
    bronzelogo:     [38, '🟫', 'Bronze'],
    steelogo:       [52, '🔩', 'Steel'],
    copperlogo:     [38, '🔶', 'Copper'],
    titaniumlogo:   [52, '⚙️', 'Titanium'],
    firelogo:       [4, '🔥', 'Fire'],
    icelogo:        [171, '🧊', 'Ice'],
    iceglowlogo:    [171, '❄️', 'Ice Glow'],
    lightninglogo:  [88, '⚡', 'Lightning'],
    rainbowlogo:    [147, '🌈', 'Rainbow'],
    sunlogo:        [6, '☀️', 'Sun'],
    moonlogo:       [37, '🌙', 'Moon'],
    dragonlogo:     [110, '🐉', 'Dragon'],
    phoenixlogo:    [4, '🦅', 'Phoenix'],
    wizardlogo:     [95, '🧙', 'Wizard'],
    crystallogo:    [55, '🔮', 'Crystal'],
    darkmagiclogo:  [95, '🪄', 'Dark Magic'],
    shadowlogo:     [65, '🌑', 'Shadow'],
    smokelogo:      [27, '💨', 'Smoke'],
    bloodlogo:      [79, '🩸', 'Blood'],
    neonlogo:       [48, '💡', 'Neon'],
    glowlogo:       [48, '✨', 'Glow'],
    gradientlogo:   [1, '🎨', 'Gradient'],
    matrixlogo:     [59, '🖥️', 'Matrix'],
    aqualogo:       [171, '💧', 'Aqua'],
};

// Generic logo generator using TextPro/alternative API
async function generateLogo(text, style) {
    const q = encodeURIComponent(text);
    const urls = [
        `https://api.giftedtech.my.id/api/text/ephoto360?apikey=gifted&text=${q}&id=${style}`,
        `https://api.siputzx.my.id/api/m/ephoto360?text=${q}&id=${style}`
    ];
    for (const url of urls) {
        try {
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 });
            if (!res.ok) continue;
            const type = res.headers.get('content-type') || '';
            if (type.includes('image')) return await res.buffer();
            const d = await res.json();
            const imageUrl = d?.result || d?.data?.url || d?.data?.imageUrl || d?.url || d?.image;
            if (imageUrl) {
                const image = await fetch(imageUrl, { timeout: 30000 });
                const buf = await image.buffer();
                if (buf.length > 500) return buf;
            }
        } catch (_) {}
    }
    throw new Error('ephoto360 providers unavailable');
}

// Fallback: use API endpoint for image generation
async function generateLogoFallback(text, styleName) {
    const res = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(`${styleName} text logo saying ${text}, professional, high quality`)}?width=1024&height=512&nologo=true&model=flux`, { timeout: 90000 });
    const buf = await res.buffer();
    if (buf.length > 500) return buf;
    throw new Error('AI fallback failed');
}

function makeLogoCommand(cmd, style, emoji, styleName) {
    return async function (sock, chatId, message) {
        const text = getArg(message, cmd);
        if (!text) return sock.sendMessage(chatId, { text: `Usage: .${cmd} <text>\nExample: .${cmd} LordFarhan` }, { quoted: message });
        await sock.sendMessage(chatId, { text: `${emoji} Generating *${styleName}* logo…` }, { quoted: message });
        try {
            let imgBuf;
            try { imgBuf = await generateLogo(text, style); }
            catch { imgBuf = await generateLogoFallback(text, styleName); }
            await sock.sendMessage(chatId, { image: imgBuf, caption: `${emoji} *${styleName} Logo*\n\nText: ${text}` }, { quoted: message });
        } catch (e) {
            // Final fallback: rich text message
            await sock.sendMessage(chatId, {
                text: `${emoji} *${styleName} Logo — "${text}"*\n\n🎨 Logo image providers are temporarily unavailable. Please try again shortly.`
            }, { quoted: message });
        }
    };
}

// Create all logo commands
const commands = {};
for (const [cmd, [style, emoji, name]] of Object.entries(LOGO_EFFECTS)) {
    commands[`${cmd}Command`] = makeLogoCommand(cmd, style, emoji, name);
}

// ── .logomenu ─────────────────────────────────────────────────────────────────
async function logoMenuCommand(sock, chatId, message) {
    const bar = '─'.repeat(28);
    await sock.sendMessage(chatId, {
        text: `🎨 *LOGO DESIGN STUDIO*\n\n┌${bar}┐\n💰 *Metal Effects*\n┃  .goldlogo  .silverlogo\n┃  .platinumlogo  .chromelogo\n┃  .diamondlogo  .bronzelogo\n┃  .steelogo  .copperlogo\n┃  .titaniumlogo\n└${bar}┘\n\n┌${bar}┐\n🔥 *Elemental Effects*\n┃  .firelogo  .icelogo\n┃  .iceglowlogo  .lightninglogo\n┃  .rainbowlogo  .sunlogo\n┃  .moonlogo  .aqualogo\n└${bar}┘\n\n┌${bar}┐\n🐉 *Fantasy Effects*\n┃  .dragonlogo  .phoenixlogo\n┃  .wizardlogo  .crystallogo\n┃  .darkmagiclogo\n└${bar}┘\n\n┌${bar}┐\n✨ *Modern Effects*\n┃  .shadowlogo  .smokelogo\n┃  .bloodlogo  .neonlogo\n┃  .glowlogo  .gradientlogo\n┃  .matrixlogo\n└${bar}┘\n\nUsage: .goldlogo <your text>\n\n> 🤖 _LordFarhan Bot_`
    }, { quoted: message });
}
commands.logoMenuCommand = logoMenuCommand;

module.exports = commands;
