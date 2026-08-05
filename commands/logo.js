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

// TextPro API (free, many effects)
const TEXTPRO = 'https://textpro.me';

// Logo effect data: [id/style, emoji, desc]
const LOGO_EFFECTS = {
    goldlogo:       ['gold-text-effect-online',       '🟡', 'Gold'],
    silverlogo:     ['chrome-text-effect',            '⚪', 'Silver'],
    platinumlogo:   ['platinum-logo-effect',          '🔘', 'Platinum'],
    chromelogo:     ['chrome-text-effect',            '💿', 'Chrome'],
    diamondlogo:    ['diamond-text-effect-online',    '💎', 'Diamond'],
    bronzelogo:     ['bronze-logo-text-effect-online','🟫', 'Bronze'],
    steelogo:       ['steel-logo-text-effect-online', '🔩', 'Steel'],
    copperlogo:     ['copper-logo-text-effect',       '🔶', 'Copper'],
    titaniumlogo:   ['titanium-text-effect',          '⚙️', 'Titanium'],
    firelogo:       ['fire-text-effect-online',       '🔥', 'Fire'],
    icelogo:        ['ice-text-effect-online',        '🧊', 'Ice'],
    iceglowlogo:    ['ice-glow-text',                 '❄️', 'Ice Glow'],
    lightninglogo:  ['lightning-text-effect',         '⚡', 'Lightning'],
    rainbowlogo:    ['rainbow-text-effect-online',    '🌈', 'Rainbow'],
    sunlogo:        ['sun-text-effect',               '☀️', 'Sun'],
    moonlogo:       ['moon-text-effect',              '🌙', 'Moon'],
    dragonlogo:     ['dragon-text-effect',            '🐉', 'Dragon'],
    phoenixlogo:    ['phoenix-text-effect-online',    '🦅', 'Phoenix'],
    wizardlogo:     ['wizard-text-effect-online',     '🧙', 'Wizard'],
    crystallogo:    ['crystal-text-effect',           '🔮', 'Crystal'],
    darkmagiclogo:  ['dark-magic-text-effect',        '🪄', 'Dark Magic'],
    shadowlogo:     ['shadow-text-effect-online',     '🌑', 'Shadow'],
    smokelogo:      ['smoke-text-effect-online',      '💨', 'Smoke'],
    bloodlogo:      ['blood-text-effect-online',      '🩸', 'Blood'],
    neonlogo:       ['neon-text-effect-online',       '💡', 'Neon'],
    glowlogo:       ['glow-text-effect-online',       '✨', 'Glow'],
    gradientlogo:   ['gradient-text-effect',          '🎨', 'Gradient'],
    matrixlogo:     ['matrix-text-effect',            '🖥️', 'Matrix'],
    aqualogo:       ['water-text-effect-online',      '💧', 'Aqua'],
};

// Generic logo generator using TextPro/alternative API
async function generateLogo(text, style) {
    // Try textpro style API
    const url = `https://textpro.me/api/text-effect/${style}?text=${encodeURIComponent(text)}&font=default`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
    if (res.ok) {
        const buf = await res.buffer();
        if (buf.length > 1000) return buf;
    }
    throw new Error('API returned no image');
}

// Fallback: use API endpoint for image generation
async function generateLogoFallback(text, styleName) {
    const apiUrl = `https://api.picsart.io/tools/1.0/text-to-image`;
    // Use a simple text image API
    const encText = encodeURIComponent(text);
    const url = `https://api.lolhuman.xyz/api/teksgan?apikey=85faf717d0545d14074659ad&text=${encText}&style=${encodeURIComponent(styleName)}`;
    const res = await fetch(url, { timeout: 15000 });
    if (res.ok) {
        const d = await res.json();
        if (d.result) {
            const imgRes = await fetch(d.result);
            return await imgRes.buffer();
        }
    }
    throw new Error('Fallback failed');
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
                text: `${emoji} *${styleName} Logo — "${text}"*\n\n🎨 Logo image generation is temporarily unavailable.\nTry: https://textpro.me\n\n_Type your text on the website to download the ${styleName} effect._`
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
