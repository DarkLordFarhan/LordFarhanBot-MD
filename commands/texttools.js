'use strict';
/**
 * Text manipulation commands:
 * .reverse / .rev — reverse text
 * .upper          — UPPERCASE
 * .lower          — lowercase
 * .mock           — mOcK tExT
 * .clap           — add 👏 between words
 * .morse          — text to morse code
 * .binary / .bin  — text to binary
 * .base64 / .b64  — base64 encode
 * .unbase64/.ub64 — base64 decode
 * .snake          — snake_case
 * .camel          — camelCase
 * .uptime         — bot uptime
 * .calc / .calculate — simple calculator
 * .password / .genpass — random password
 */

const MORSE = {
    'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..',
    '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.',
    '.':'.-.-.-',',':'--..--','?':'..--..','!':'-.-.--','/':'-..-.','(':'-.--.',')':'-.--.-','&':'.-...',':':'---...', ';':'-.-.-.','=':'-...-','+':'.-.-.','_':'..--.-','"':'.-..-.','$':'...-..-','@':'.--.-.'
};

function getText(message) {
    return (
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text || ''
    ).trim();
}

function getArgs(message, cmdLen) {
    return getText(message).slice(cmdLen).trim();
}

// ── reverse ───────────────────────────────────────────────────────────────────
async function reverseCommand(sock, chatId, message) {
    const text = getText(message);
    const args = text.replace(/^\.(reverse|rev)\s*/i, '');
    if (!args) return sock.sendMessage(chatId, { text: 'Usage: .reverse <text>' }, { quoted: message });
    await sock.sendMessage(chatId, { text: args.split('').reverse().join('') }, { quoted: message });
}

// ── upper ─────────────────────────────────────────────────────────────────────
async function upperCommand(sock, chatId, message) {
    const args = getText(message).replace(/^\.upper\s*/i, '');
    if (!args) return sock.sendMessage(chatId, { text: 'Usage: .upper <text>' }, { quoted: message });
    await sock.sendMessage(chatId, { text: args.toUpperCase() }, { quoted: message });
}

// ── lower ─────────────────────────────────────────────────────────────────────
async function lowerCommand(sock, chatId, message) {
    const args = getText(message).replace(/^\.lower\s*/i, '');
    if (!args) return sock.sendMessage(chatId, { text: 'Usage: .lower <text>' }, { quoted: message });
    await sock.sendMessage(chatId, { text: args.toLowerCase() }, { quoted: message });
}

// ── mock ──────────────────────────────────────────────────────────────────────
async function mockCommand(sock, chatId, message) {
    const args = getText(message).replace(/^\.(mock|spongebob)\s*/i, '');
    if (!args) return sock.sendMessage(chatId, { text: 'Usage: .mock <text>' }, { quoted: message });
    const mocked = args.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('');
    await sock.sendMessage(chatId, { text: mocked }, { quoted: message });
}

// ── clap ──────────────────────────────────────────────────────────────────────
async function clapCommand(sock, chatId, message) {
    const args = getText(message).replace(/^\.clap\s*/i, '');
    if (!args) return sock.sendMessage(chatId, { text: 'Usage: .clap <text>' }, { quoted: message });
    const clapText = args.split(' ').join(' 👏 ');
    await sock.sendMessage(chatId, { text: `${clapText} 👏` }, { quoted: message });
}

// ── morse ─────────────────────────────────────────────────────────────────────
async function morseCommand(sock, chatId, message) {
    const args = getText(message).replace(/^\.morse\s*/i, '');
    if (!args) return sock.sendMessage(chatId, { text: 'Usage: .morse <text>' }, { quoted: message });
    const encoded = args.toUpperCase().split('').map(c => {
        if (c === ' ') return '/';
        return MORSE[c] || c;
    }).join(' ');
    await sock.sendMessage(chatId, {
        text: `📡 *Morse Code:*\n\`${encoded}\``
    }, { quoted: message });
}

// ── binary ────────────────────────────────────────────────────────────────────
async function binaryCommand(sock, chatId, message) {
    const args = getText(message).replace(/^\.(binary|bin)\s*/i, '');
    if (!args) return sock.sendMessage(chatId, { text: 'Usage: .binary <text>' }, { quoted: message });
    const encoded = args.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
    await sock.sendMessage(chatId, {
        text: `💻 *Binary:*\n\`${encoded}\``
    }, { quoted: message });
}

// ── base64 ────────────────────────────────────────────────────────────────────
async function base64Command(sock, chatId, message) {
    const args = getText(message).replace(/^\.(base64|b64)\s*/i, '');
    if (!args) return sock.sendMessage(chatId, { text: 'Usage: .base64 <text>' }, { quoted: message });
    const encoded = Buffer.from(args).toString('base64');
    await sock.sendMessage(chatId, {
        text: `🔐 *Base64 Encoded:*\n\`${encoded}\``
    }, { quoted: message });
}

// ── unbase64 ──────────────────────────────────────────────────────────────────
async function unbase64Command(sock, chatId, message) {
    const args = getText(message).replace(/^\.(unbase64|ub64)\s*/i, '');
    if (!args) return sock.sendMessage(chatId, { text: 'Usage: .unbase64 <base64_text>' }, { quoted: message });
    try {
        const decoded = Buffer.from(args, 'base64').toString('utf8');
        await sock.sendMessage(chatId, {
            text: `🔓 *Decoded:*\n${decoded}`
        }, { quoted: message });
    } catch {
        await sock.sendMessage(chatId, { text: '❌ Invalid base64 string.' }, { quoted: message });
    }
}

// ── snake_case ────────────────────────────────────────────────────────────────
async function snakeCommand(sock, chatId, message) {
    const args = getText(message).replace(/^\.snake\s*/i, '');
    if (!args) return sock.sendMessage(chatId, { text: 'Usage: .snake <text>' }, { quoted: message });
    const snaked = args.trim().toLowerCase().replace(/\s+/g, '_');
    await sock.sendMessage(chatId, { text: snaked }, { quoted: message });
}

// ── camelCase ─────────────────────────────────────────────────────────────────
async function camelCommand(sock, chatId, message) {
    const args = getText(message).replace(/^\.camel\s*/i, '');
    if (!args) return sock.sendMessage(chatId, { text: 'Usage: .camel <text>' }, { quoted: message });
    const words = args.trim().toLowerCase().split(/\s+/);
    const cameled = words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    await sock.sendMessage(chatId, { text: cameled }, { quoted: message });
}

// ── uptime ────────────────────────────────────────────────────────────────────
const _startTime = Date.now();
async function uptimeCommand(sock, chatId, message) {
    const ms = Date.now() - _startTime;
    const s  = Math.floor(ms / 1000) % 60;
    const m  = Math.floor(ms / 60000) % 60;
    const h  = Math.floor(ms / 3600000) % 24;
    const d  = Math.floor(ms / 86400000);
    await sock.sendMessage(chatId, {
        text: `⏱️ *Bot Uptime*\n${d}d ${h}h ${m}m ${s}s`
    }, { quoted: message });
}

// ── calculator ────────────────────────────────────────────────────────────────
async function calcCommand(sock, chatId, message) {
    const args = getText(message).replace(/^\.(calc|calculate)\s*/i, '');
    if (!args) return sock.sendMessage(chatId, { text: 'Usage: .calc <expression>\nExample: .calc 2 + 2 * 5' }, { quoted: message });
    try {
        // Safe eval: only allow numbers and basic operators
        if (!/^[\d\s\+\-\*\/\(\)\.\%\^]+$/.test(args)) {
            return sock.sendMessage(chatId, { text: '❌ Invalid expression. Only numbers and operators (+, -, *, /, %, .) allowed.' }, { quoted: message });
        }
        // Replace ^ with ** for exponent
        const expr = args.replace(/\^/g, '**');
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict"; return (${expr})`)();
        if (!isFinite(result)) throw new Error('Division by zero or overflow');
        await sock.sendMessage(chatId, {
            text: `🧮 *Calculator*\n${args} = *${result}*`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Math error: ${e.message}` }, { quoted: message });
    }
}

// ── password generator ────────────────────────────────────────────────────────
async function passwordCommand(sock, chatId, message) {
    const args = getText(message).replace(/^\.(password|genpass|passgen)\s*/i, '');
    const len  = Math.min(Math.max(parseInt(args) || 16, 6), 64);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
    let pwd = '';
    for (let i = 0; i < len; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    await sock.sendMessage(chatId, {
        text: `🔑 *Generated Password (${len} chars):*\n\`${pwd}\`\n\n_Tip: .password 24 for a 24-char password_`
    }, { quoted: message });
}

module.exports = {
    reverseCommand,
    upperCommand,
    lowerCommand,
    mockCommand,
    clapCommand,
    morseCommand,
    binaryCommand,
    base64Command,
    unbase64Command,
    snakeCommand,
    camelCommand,
    uptimeCommand,
    calcCommand,
    passwordCommand,
};
