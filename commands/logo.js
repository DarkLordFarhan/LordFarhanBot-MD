const { execFile } = require('child_process');
const path = require('path');

const STYLES = {
    goldlogo:'gold logo', silverlogo:'silver logo', firelogo:'fire logo',
    neonlogo:'neon logo', icelogo:'ice logo', iceglowlogo:'ice glow logo',
    lightninglogo:'lightning logo', rainbowlogo:'rainbow logo',
    shadowlogo:'shadow logo', smokelogo:'smoke logo', bloodlogo:'blood logo',
    dragonlogo:'dragon logo', platinumlogo:'platinum logo', chromelogo:'chrome logo',
    diamondlogo:'diamond logo', bronzelogo:'bronze logo', steelogo:'steel logo',
    steellogo:'steel logo', copperlogo:'copper logo', titaniumlogo:'titanium logo',
    sunlogo:'sun logo', moonlogo:'moon logo', aqualogo:'aqua logo',
    phoenixlogo:'phoenix logo', wizardlogo:'wizard logo', crystallogo:'crystal logo',
    darkmagiclogo:'dark magic logo', glowlogo:'glow logo',
    gradientlogo:'gradient logo', matrixlogo:'matrix logo'
};

function getText(message, command) {
    const raw =
        message?.message?.conversation ||
        message?.message?.extendedTextMessage?.text ||
        message?.message?.imageMessage?.caption ||
        message?.message?.videoMessage?.caption || '';
    return raw.trim().slice(command.length).trim();
}

function runEphoto(style, text) {
    return new Promise((resolve, reject) => {
        execFile(
            'python3',
            [path.join(process.cwd(), 'ephoto360_logo.py'), style, text],
            { timeout: 180000, maxBuffer: 2 * 1024 * 1024 },
            (error, stdout, stderr) => {
                if (error) return reject(new Error(stderr?.trim() || error.message));
                try { resolve(JSON.parse(stdout.trim())); }
                catch { reject(new Error(`Invalid Ephoto360 response: ${stdout}`)); }
            }
        );
    });
}

async function makeLogo(sock, chatId, message, name, style) {
    const text = getText(message, `.${name}`);

    if (!text) {
        return sock.sendMessage(chatId, {
            text: `🎨 *.${name}*\n\nUsage:\n.${name} Your Text\n\nExample:\n.${name} Lord Farhan`
        }, { quoted: message });
    }

    await sock.sendMessage(chatId, {
        text: `🎨 *EPHOTO360*\n\n✨ Style: *${style}*\n✏️ Text: *${text}*\n\n⏳ Generating...`
    }, { quoted: message });

    try {
        const result = await runEphoto(style, text);

        if (!result.ok || !result.url) {
            throw new Error(result.error || 'No compatible Ephoto360 effect');
        }

        await sock.sendMessage(chatId, {
            image: { url: result.url },
            caption:
                `🎨 *EPHOTO360 LOGO*\n\n` +
                `✏️ Text: *${text}*\n` +
                `✨ Effect: *${result.effect || style}*`
        }, { quoted: message });

    } catch (error) {
        console.error(`Ephoto360 .${name}:`, error);
        await sock.sendMessage(chatId, {
            text: `❌ *Ephoto360 failed*\n\nStyle: *${style}*\nText: *${text}*\n\nTry again or use another logo style.`
        }, { quoted: message });
    }
}

const exported = {};

for (const [name, style] of Object.entries(STYLES)) {
    exported[`${name}Command`] =
        (sock, chatId, message) => makeLogo(sock, chatId, message, name, style);
}

exported.logoMenuCommand = async (sock, chatId, message) => {
    const menu =
        `🎨 *EPHOTO360 LOGO STUDIO*\n\n` +
        Object.keys(STYLES)
            .map(n => `🔹 .${n} Your Text`)
            .join('\n') +
        `\n\nExample:\n.goldlogo Lord Farhan\n.neonlogo DarkLord Farhan\n.dragonlogo Lord Farhan`;

    await sock.sendMessage(chatId, { text: menu }, { quoted: message });
};

module.exports = exported;
